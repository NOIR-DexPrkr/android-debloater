package main

import (
	"testing"
)

func TestVersionCompare(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"2026.10.17", "2026.10.30", -1},
		{"2026.10.30", "2026.10.17", 1},
		{"2026.10.30", "2026.10.30", 0},
		{"2026.10.30", "2026.10.30.1", -1},
		{"2026.10.30.2", "2026.10.30.1", 1},
		{"2027.01.01", "2026.12.31", 1},
	}
	for _, c := range cases {
		got := versionCompare(c.a, c.b)
		if (got < 0) != (c.want < 0) || (got > 0) != (c.want > 0) || (got == 0) != (c.want == 0) {
			t.Errorf("versionCompare(%q, %q) = %d, want signo de %d", c.a, c.b, got, c.want)
		}
	}
}

// TestValidateRepo is the gate for the whole lists/ directory: schema,
// manifest consistency and cross-list duplicates.
func TestValidateRepo(t *testing.T) {
	root, err := repoRoot()
	if err != nil {
		t.Fatal(err)
	}
	if errs := validateRepo(root); len(errs) > 0 {
		for _, e := range errs {
			t.Error(e)
		}
	}
}
