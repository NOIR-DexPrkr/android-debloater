package main

import (
	"regexp"
	"strings"
)

// BloatwareInfo contains metadata for a known package (see lists/*.json)
type BloatwareInfo struct {
	Description string
	Category    string // "bloatware", "oem", "system"
	Risk        string // "safe", "caution", "danger"
	ListID      string // "general", brand id, or "" for heuristic guesses
}

// packageNameRegex validates package names to prevent shell injection
var packageNameRegex = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

// classifyPackage returns bloatware info for a package on a given brand,
// or sensible defaults for unknowns. Precedence: brand list → general list
// → prefix heuristics.
func classifyPackage(name, brandID string) BloatwareInfo {
	if brandID != "" {
		if info, ok := lookupKnown(brandID, name); ok {
			return info
		}
	}
	if info, ok := lookupKnown(generalListID, name); ok {
		return info
	}

	// Classify by prefix for unknown packages
	switch {
	case strings.HasPrefix(name, "com.google.android.gms"),
		strings.HasPrefix(name, "com.google.android.gsf"),
		strings.HasPrefix(name, "com.android.vending"):
		return BloatwareInfo{Description: name, Category: "system", Risk: "danger"}
	case strings.HasPrefix(name, "com.android."), strings.HasPrefix(name, "android."):
		return BloatwareInfo{Description: name, Category: "system", Risk: "danger"}
	case strings.HasPrefix(name, "com.miui."),
		strings.HasPrefix(name, "com.xiaomi."),
		strings.HasPrefix(name, "com.mi."),
		strings.HasPrefix(name, "com.samsung."),
		strings.HasPrefix(name, "com.sec."),
		strings.HasPrefix(name, "com.huawei."),
		strings.HasPrefix(name, "com.hihonor."),
		strings.HasPrefix(name, "com.hicloud."),
		strings.HasPrefix(name, "com.oppo."),
		strings.HasPrefix(name, "com.coloros."),
		strings.HasPrefix(name, "com.heytap."),
		strings.HasPrefix(name, "com.realme."),
		strings.HasPrefix(name, "com.oneplus."),
		strings.HasPrefix(name, "com.vivo."),
		strings.HasPrefix(name, "com.bbk."),
		strings.HasPrefix(name, "com.iqoo."),
		strings.HasPrefix(name, "com.motorola."),
		strings.HasPrefix(name, "com.google.android."),
		strings.HasPrefix(name, "com.asus."),
		strings.HasPrefix(name, "com.sony."),
		strings.HasPrefix(name, "com.sonyericsson."),
		strings.HasPrefix(name, "com.evenwell."),
		strings.HasPrefix(name, "com.lenovo."),
		strings.HasPrefix(name, "com.zui."),
		strings.HasPrefix(name, "com.zte."),
		strings.HasPrefix(name, "com.tcl."),
		strings.HasPrefix(name, "com.alcatel."),
		strings.HasPrefix(name, "com.nubia."),
		strings.HasPrefix(name, "com.meizu."),
		strings.HasPrefix(name, "com.qualcomm."),
		strings.HasPrefix(name, "com.mediatek."):
		return BloatwareInfo{Description: name, Category: "oem", Risk: "caution"}
	default:
		return BloatwareInfo{Description: name, Category: "user", Risk: "safe"}
	}
}

// serialRegex validates device serials, allowing ":" for wireless ADB (e.g. 192.168.1.5:5555)
var serialRegex = regexp.MustCompile(`^[a-zA-Z0-9._:-]+$`)

// isValidPackageName checks if a package name is safe to use in shell commands
func isValidPackageName(name string) bool {
	return packageNameRegex.MatchString(name) && len(name) > 0
}

// isValidSerial checks if a device serial is safe to pass to adb -s
func isValidSerial(serial string) bool {
	return serialRegex.MatchString(serial)
}
