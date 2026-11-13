package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

// remoteListURL is where the maintained package lists are published; the app
// pulls the manifest so users get updates for new OS releases without a new
// app build. Override with NOIRADB_LIST_URL.
const remoteListURL = "https://raw.githubusercontent.com/NOIR-DexPrkr/universal-debloater/main/lists/manifest.json"

// maxListSize caps each downloaded file so a bad response cannot exhaust memory
const maxListSize = 5 << 20

//go:embed lists
var embeddedLists embed.FS

// ManifestEntry describes one package list in manifest.json
type ManifestEntry struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	File    string   `json:"file"`
	Aliases []string `json:"aliases"`  // ro.product.brand / manufacturer values that map to this list
	OSNames []string `json:"os_names"` // marketing names of the OS skins (HyperOS, One UI…)
	Version string   `json:"version"`
	Count   int      `json:"count"`
}

// Manifest indexes every package list and carries the brand metadata used
// for device detection
type Manifest struct {
	Version string          `json:"version"`
	Updated string          `json:"updated"`
	Lists   []ManifestEntry `json:"lists"`
}

// BloatList is the on-disk and remote format of one package list
type BloatList struct {
	Version  string         `json:"version"`
	Updated  string         `json:"updated"`
	Packages []PackageEntry `json:"packages"`
}

// PackageEntry describes one known package
type PackageEntry struct {
	Package     string   `json:"package"`
	Description string   `json:"description"`
	Category    string   `json:"category"` // "bloatware", "oem", "system"
	Risk        string   `json:"risk"`     // "safe", "caution", "danger"
	OS          []string `json:"os,omitempty"`
	Sources     []string `json:"sources,omitempty"`
	NeverRemove bool     `json:"neverRemove,omitempty"`
}

// generalListID is the list of packages common across brands
const generalListID = "general"

var (
	listMu      sync.RWMutex
	metaByID    = map[string]ManifestEntry{}            // list id → manifest metadata
	listOrder   []string                                // ids in load order
	knownByID   = map[string]map[string]BloatwareInfo{} // list id → package → info
	sourceByID  = map[string]string{}                   // list id → "integrada", "caché" o "descargada"
	updatedByID = map[string]string{}                   // list id → date of the active list
)

// parseList decodes and sanity-checks a package list
func parseList(data []byte) (*BloatList, error) {
	var list BloatList
	if err := json.Unmarshal(data, &list); err != nil {
		return nil, fmt.Errorf("al analizar la lista de paquetes: %w", err)
	}
	if list.Version == "" || len(list.Packages) == 0 {
		return nil, fmt.Errorf("la lista de paquetes no tiene versión o paquetes")
	}
	return &list, nil
}

// parseManifest decodes and sanity-checks a package-list manifest
func parseManifest(data []byte) (*Manifest, error) {
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("al analizar el manifiesto de listas: %w", err)
	}
	if m.Version == "" || len(m.Lists) == 0 {
		return nil, fmt.Errorf("el manifiesto de listas no tiene versión o listas")
	}
	return &m, nil
}

// applyEntry records the metadata of one active list
func applyEntry(e ManifestEntry) {
	listMu.Lock()
	defer listMu.Unlock()
	metaByID[e.ID] = e
}

// applyList makes list the active database for one list id
func applyList(id string, list *BloatList, source string) {
	m := make(map[string]BloatwareInfo, len(list.Packages))
	for _, p := range list.Packages {
		if !isValidPackageName(p.Package) {
			continue
		}
		m[p.Package] = BloatwareInfo{Description: p.Description, Category: p.Category, Risk: p.Risk, ListID: id}
	}

	listMu.Lock()
	defer listMu.Unlock()
	if _, ok := knownByID[id]; !ok {
		listOrder = append(listOrder, id)
	}
	knownByID[id] = m
	sourceByID[id] = source
	updatedByID[id] = list.Updated
}

// activeVersion returns the version of the active list, if any
func activeVersion(id string) string {
	listMu.RLock()
	defer listMu.RUnlock()
	return metaByID[id].Version
}

// lookupKnown returns the list entry for a package in one list, if any
func lookupKnown(id, name string) (BloatwareInfo, bool) {
	listMu.RLock()
	defer listMu.RUnlock()
	m, ok := knownByID[id]
	if !ok {
		return BloatwareInfo{}, false
	}
	info, ok := m[name]
	return info, ok
}

// resolveBrand maps getprop brand/manufacturer values to a list id using the
// manifest aliases (e.g. "Redmi" → "xiaomi", "HMD" → "nokia")
func resolveBrand(values ...string) string {
	listMu.RLock()
	defer listMu.RUnlock()
	alias := map[string]string{}
	for id, e := range metaByID {
		for _, a := range e.Aliases {
			alias[strings.ToLower(strings.TrimSpace(a))] = id
		}
		alias[strings.ToLower(id)] = id
	}
	for _, v := range values {
		v = strings.ToLower(strings.TrimSpace(v))
		if v == "" {
			continue
		}
		if id, ok := alias[v]; ok {
			return id
		}
		for _, word := range strings.FieldsFunc(v, func(r rune) bool {
			return (r < 'a' || r > 'z') && (r < '0' || r > '9')
		}) {
			if id, ok := alias[word]; ok {
				return id
			}
		}
	}
	return ""
}

// brandMeta returns the metadata of one brand list
func brandMeta(id string) (ManifestEntry, bool) {
	listMu.RLock()
	defer listMu.RUnlock()
	e, ok := metaByID[id]
	return e, ok
}

// cacheDir is where downloaded lists are kept between runs
func cacheDir() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "noiradb", "lists"), nil
}

// loadListsFrom activates a manifest and its files from a file loader. When
// onlyNewer is set, lists older or equal to the active version are skipped.
func loadListsFrom(read func(string) ([]byte, error), source string, onlyNewer bool) {
	data, err := read("lists/manifest.json")
	if err != nil {
		return
	}
	m, err := parseManifest(data)
	if err != nil {
		return
	}
	for _, e := range m.Lists {
		if onlyNewer && versionCompare(activeVersion(e.ID), e.Version) >= 0 {
			continue
		}
		raw, err := read("lists/" + filepath.ToSlash(e.File))
		if err != nil {
			continue
		}
		list, err := parseList(raw)
		if err != nil {
			continue
		}
		applyEntry(e)
		applyList(e.ID, list, source)
	}
}

// loadLists activates the embedded lists, then any newer cached downloads
func loadLists() {
	loadListsFrom(embeddedLists.ReadFile, "integrada", false)

	dir, err := cacheDir()
	if err != nil {
		return
	}
	loadListsFrom(func(p string) ([]byte, error) {
		return os.ReadFile(filepath.Join(dir, filepath.FromSlash(strings.TrimPrefix(p, "lists/"))))
	}, "caché", true)
}

// GetListsInfo reports which package lists are active and where they came from
func (a *App) GetListsInfo() []ListInfo {
	listMu.RLock()
	defer listMu.RUnlock()
	infos := []ListInfo{}
	for _, id := range listOrder {
		e := metaByID[id]
		infos = append(infos, ListInfo{
			ID:      id,
			Name:    e.Name,
			Version: e.Version,
			Updated: updatedByID[id],
			Count:   len(knownByID[id]),
			Source:  sourceByID[id],
		})
	}
	return infos
}

// GetBrands returns the known brands and their list sizes, for the UI selector
func (a *App) GetBrands() []BrandInfo {
	listMu.RLock()
	defer listMu.RUnlock()
	brands := []BrandInfo{}
	for _, id := range listOrder {
		if id == generalListID {
			continue
		}
		e := metaByID[id]
		brands = append(brands, BrandInfo{
			ID:      e.ID,
			Name:    e.Name,
			OSNames: e.OSNames,
			Version: e.Version,
			Count:   len(knownByID[id]),
		})
	}
	return brands
}

// listBaseURL derives the directory of the list files from the manifest URL
func listBaseURL(manifestURL string) string {
	u, err := url.Parse(manifestURL)
	if err != nil {
		return ""
	}
	u.Path = path.Dir(u.Path)
	if !strings.HasSuffix(u.Path, "/") {
		u.Path += "/"
	}
	return u.String()
}

// fetchList downloads a list file with a size cap
func fetchList(client *http.Client, base, file string) ([]byte, error) {
	if strings.Contains(file, "..") {
		return nil, fmt.Errorf("ruta de lista no válida: %s", file)
	}
	resp, err := client.Get(base + file)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return io.ReadAll(io.LimitReader(resp.Body, maxListSize))
}

// UpdateList downloads the package-list manifest and every list different
// from the active one, then caches them
func (a *App) UpdateList() ([]ListInfo, error) {
	listURL := os.Getenv("NOIRADB_LIST_URL")
	if listURL == "" {
		listURL = remoteListURL
	}
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(listURL)
	if err != nil {
		return a.GetListsInfo(), fmt.Errorf("al descargar el manifiesto de listas: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return a.GetListsInfo(), fmt.Errorf("al descargar el manifiesto de listas: HTTP %d", resp.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, maxListSize))
	if err != nil {
		return a.GetListsInfo(), fmt.Errorf("al leer el manifiesto de listas: %w", err)
	}

	m, err := parseManifest(data)
	if err != nil {
		// A legacy single-list feed (pre-multi-brand) is accepted and loaded
		// as the general list so overridden URLs keep working
		if legacy, lerr := parseList(data); lerr == nil {
			applyList(generalListID, legacy, "descargada")
			cacheWrite("general.json", data)
			return a.GetListsInfo(), nil
		}
		return a.GetListsInfo(), err
	}

	base := listBaseURL(listURL)
	cacheWrite("manifest.json", data)
	for _, e := range m.Lists {
		if versionCompare(activeVersion(e.ID), e.Version) == 0 {
			continue
		}
		raw, err := fetchList(client, base, e.File)
		if err != nil {
			continue
		}
		list, err := parseList(raw)
		if err != nil {
			continue
		}
		applyEntry(e)
		applyList(e.ID, list, "descargada")
		cacheWrite(e.File, raw)
	}
	return a.GetListsInfo(), nil
}

// cacheWrite stores one downloaded file under the cache directory
func cacheWrite(file string, data []byte) {
	dir, err := cacheDir()
	if err != nil {
		return
	}
	p := filepath.Join(dir, filepath.FromSlash(file))
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return
	}
	_ = os.WriteFile(p, data, 0o644)
}

// versionCompare compares AAAA.MM.DD(.N) versions numerically
func versionCompare(a, b string) int {
	as, bs := strings.Split(a, "."), strings.Split(b, ".")
	for i := 0; i < len(as) || i < len(bs); i++ {
		av, bv := 0, 0
		if i < len(as) {
			av, _ = strconv.Atoi(as[i])
		}
		if i < len(bs) {
			bv, _ = strconv.Atoi(bs[i])
		}
		if av != bv {
			return av - bv
		}
	}
	return 0
}
