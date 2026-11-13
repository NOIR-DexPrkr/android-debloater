package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

// PackageEntry describes one known package in a list file.
// It mirrors the schema of lists/general.json and lists/brands/*.json.
type PackageEntry struct {
	Package     string   `json:"package"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Risk        string   `json:"risk"`
	OS          []string `json:"os,omitempty"`
	Sources     []string `json:"sources,omitempty"`
	NeverRemove bool     `json:"neverRemove,omitempty"`
}

// BloatList is the format of general.json and brands/*.json
type BloatList struct {
	Version  string         `json:"version"`
	Updated  string         `json:"updated"`
	Packages []PackageEntry `json:"packages"`
}

// ManifestEntry describes one package list in manifest.json
type ManifestEntry struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	File    string   `json:"file"`
	Aliases []string `json:"aliases"`
	OSNames []string `json:"os_names"`
	Version string   `json:"version"`
	Count   int      `json:"count"`
}

// Manifest indexes every package list and the brand metadata for detection
type Manifest struct {
	Version string          `json:"version"`
	Updated string          `json:"updated"`
	Lists   []ManifestEntry `json:"lists"`
}

var (
	versionRE   = regexp.MustCompile(`^\d{4}\.\d{2}\.\d{2}(\.\d+)?$`)
	updatedRE   = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	packageName = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)
)

var validCategories = map[string]bool{"bloatware": true, "oem": true, "system": true}
var validRisks = map[string]bool{"safe": true, "caution": true, "danger": true}

// repoRoot walks up from the working directory until it finds lists/manifest.json
func repoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "lists", "manifest.json")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no se encontró lists/manifest.json desde el directorio actual")
		}
		dir = parent
	}
}

// loadManifest reads and decodes lists/manifest.json
func loadManifest(root string) (*Manifest, error) {
	data, err := os.ReadFile(filepath.Join(root, "lists", "manifest.json"))
	if err != nil {
		return nil, err
	}
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("manifest.json: %w", err)
	}
	return &m, nil
}

// loadListFile reads and decodes one list file
func loadListFile(path string) (*BloatList, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var l BloatList
	if err := json.Unmarshal(data, &l); err != nil {
		return nil, fmt.Errorf("%s: %w", filepath.Base(path), err)
	}
	return &l, nil
}

// validateEntries checks the schema of one list's packages and returns errors
func validateEntries(list *BloatList, label string) []string {
	var errs []string
	if !versionRE.MatchString(list.Version) {
		errs = append(errs, fmt.Sprintf("%s: versión %q no tiene formato AAAA.MM.DD", label, list.Version))
	}
	if !updatedRE.MatchString(list.Updated) {
		errs = append(errs, fmt.Sprintf("%s: fecha %q no tiene formato AAAA-MM-DD", label, list.Updated))
	}
	if len(list.Packages) == 0 {
		errs = append(errs, fmt.Sprintf("%s: no tiene paquetes", label))
	}
	seen := map[string]bool{}
	for i, p := range list.Packages {
		at := fmt.Sprintf("%s paquete %d", label, i+1)
		if !packageName.MatchString(p.Package) {
			errs = append(errs, fmt.Sprintf("%s: nombre de paquete inválido %q", at, p.Package))
		}
		if seen[p.Package] {
			errs = append(errs, fmt.Sprintf("%s: paquete duplicado %q", label, p.Package))
		}
		seen[p.Package] = true
		if strings.TrimSpace(p.Description) == "" {
			errs = append(errs, fmt.Sprintf("%s (%s): descripción vacía", at, p.Package))
		}
		if !validCategories[p.Category] {
			errs = append(errs, fmt.Sprintf("%s (%s): categoría inválida %q", at, p.Package, p.Category))
		}
		if !validRisks[p.Risk] {
			errs = append(errs, fmt.Sprintf("%s (%s): riesgo inválido %q", at, p.Package, p.Risk))
		}
	}
	return errs
}

// validateRepo checks the manifest, every list file and their consistency
func validateRepo(root string) []string {
	var errs []string
	m, err := loadManifest(root)
	if err != nil {
		return []string{err.Error()}
	}
	if !versionRE.MatchString(m.Version) {
		errs = append(errs, fmt.Sprintf("manifest: versión %q no tiene formato AAAA.MM.DD", m.Version))
	}
	if !updatedRE.MatchString(m.Updated) {
		errs = append(errs, fmt.Sprintf("manifest: fecha %q no tiene formato AAAA-MM-DD", m.Updated))
	}

	seenID := map[string]bool{}
	seenFile := map[string]bool{}
	seenAlias := map[string]string{}
	generals := 0
	maxVersion, maxUpdated := "", ""

	for _, e := range m.Lists {
		label := fmt.Sprintf("manifest[%s]", e.ID)
		if e.ID == "" || e.Name == "" || e.File == "" {
			errs = append(errs, fmt.Sprintf("%s: id, name y file son obligatorios", label))
			continue
		}
		if seenID[e.ID] {
			errs = append(errs, fmt.Sprintf("%s: id duplicado", label))
		}
		seenID[e.ID] = true
		if seenFile[e.File] {
			errs = append(errs, fmt.Sprintf("%s: archivo duplicado %q", label, e.File))
		}
		seenFile[e.File] = true
		if e.ID == "general" {
			generals++
		}
		if filepath.IsAbs(e.File) || strings.Contains(e.File, "..") {
			errs = append(errs, fmt.Sprintf("%s: ruta de archivo inválida %q", label, e.File))
			continue
		}
		for _, a := range e.Aliases {
			al := strings.ToLower(strings.TrimSpace(a))
			if al != a {
				errs = append(errs, fmt.Sprintf("%s: alias %q debe ir en minúsculas", label, a))
			}
			if prev, ok := seenAlias[al]; ok {
				errs = append(errs, fmt.Sprintf("%s: alias %q ya usado por %q", label, al, prev))
			}
			seenAlias[al] = e.ID
		}

		list, err := loadListFile(filepath.Join(root, "lists", filepath.FromSlash(e.File)))
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", label, err))
			continue
		}
		errs = append(errs, validateEntries(list, e.File)...)
		if list.Version != e.Version {
			errs = append(errs, fmt.Sprintf("%s: versión del manifiesto %q no coincide con la del archivo %q", label, e.Version, list.Version))
		}
		if len(list.Packages) != e.Count {
			errs = append(errs, fmt.Sprintf("%s: el manifiesto dice %d paquetes pero el archivo tiene %d", label, e.Count, len(list.Packages)))
		}
		if versionCompare(list.Version, maxVersion) > 0 {
			maxVersion = list.Version
		}
		if list.Updated > maxUpdated {
			maxUpdated = list.Updated
		}
	}
	if generals != 1 {
		errs = append(errs, fmt.Sprintf("manifest: debe haber exactamente una lista general, hay %d", generals))
	}
	if m.Version != maxVersion {
		errs = append(errs, fmt.Sprintf("manifest: versión %q no es la mayor de los archivos (%q); ejecuta sync", m.Version, maxVersion))
	}
	if m.Updated != maxUpdated {
		errs = append(errs, fmt.Sprintf("manifest: fecha %q no es la mayor de los archivos (%q); ejecuta sync", m.Updated, maxUpdated))
	}

	// A package must not appear in more than one list
	owners := map[string]string{}
	for _, e := range m.Lists {
		list, err := loadListFile(filepath.Join(root, "lists", filepath.FromSlash(e.File)))
		if err != nil {
			continue
		}
		for _, p := range list.Packages {
			if prev, ok := owners[p.Package]; ok {
				errs = append(errs, fmt.Sprintf("paquete %q aparece en %q y en %q", p.Package, prev, e.File))
			}
			owners[p.Package] = e.File
		}
	}
	return errs
}

// syncManifest rewrites versions, counts and dates in manifest.json from the files
func syncManifest(root string) error {
	m, err := loadManifest(root)
	if err != nil {
		return err
	}
	maxVersion, maxUpdated := "", ""
	for i := range m.Lists {
		e := &m.Lists[i]
		list, err := loadListFile(filepath.Join(root, "lists", filepath.FromSlash(e.File)))
		if err != nil {
			return err
		}
		e.Version = list.Version
		e.Count = len(list.Packages)
		if versionCompare(list.Version, maxVersion) > 0 {
			maxVersion = list.Version
		}
		if list.Updated > maxUpdated {
			maxUpdated = list.Updated
		}
	}
	m.Version = maxVersion
	m.Updated = maxUpdated
	return writeJSON(filepath.Join(root, "lists", "manifest.json"), m)
}

// writeJSON encodes any value with repository formatting
func writeJSON(path string, v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
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
