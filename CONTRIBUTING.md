# Contributing

The most useful contribution is keeping the package lists accurate for new devices and OS releases.

## Updating the package lists

All package data lives under [`lists/`](lists):

- [`lists/manifest.json`](lists/manifest.json) — indexes every list and carries the brand metadata used for device detection: `aliases` map `ro.product.brand` / `ro.product.manufacturer` values to a list.
- [`lists/general.json`](lists/general.json) — bloatware shared across brands (Facebook, Netflix, TikTok and other third-party preloads).
- [`lists/brands/<brand>.json`](lists/brands) — one file per brand (Xiaomi, Samsung, Google Pixel, OnePlus, OPPO, realme, vivo, Motorola, Huawei/Honor and smaller brands).

The app downloads the latest manifest and lists from the `main` branch, so a merged change reaches users without a new app release.

Each entry looks like this:

```json
{
  "package": "com.miui.analytics",
  "description": "Xiaomi usage analytics and telemetry. Nothing visible breaks when removed.",
  "category": "bloatware",
  "risk": "safe",
  "os": ["miui", "hyperos1", "hyperos2", "hyperos3"]
}
```

| Field | Values |
|---|---|
| `category` | `bloatware` (ads, telemetry, third-party preloads), `oem` (vendor apps and services), `system` (Android/Google framework) |
| `risk` | `safe` (no side effects for most people), `caution` (removes a feature someone may use), `danger` (can break calls, SIM, Settings, launcher, or cause a bootloop) |
| `os` | Optional. Where the package is known to exist: `miui`, `hyperos1`, `hyperos2`, `hyperos3`, `oneui`, `coloros`… |
| `sources` | Optional. Where the entry comes from, e.g. `uad` |
| `neverRemove` | Optional. `true` for packages that must never be removed |

When you change a list:

1. Keep entries sorted by `package`. A package belongs to exactly one list: shared third-party stubs go in `general.json`, brand-specific packages in `brands/<brand>.json`.
2. Write descriptions in your own words, and say what breaks when the package is removed.
3. If you are unsure, use the more cautious risk level.
4. Bump `version` and `updated` at the top of the file to today's date (`YYYY.MM.DD`; add `.1`, `.2` for several updates on one day). The app only replaces a list when its version is newer.
5. Run the list tool so the manifest stays in sync:

```bash
go run ./scripts/lists validate   # schema, duplicates, manifest consistency
go run ./scripts/lists sync       # refresh versions and counts in lists/manifest.json
```

`go test ./scripts/...` runs the same checks in CI.

Not sure about a package? Open a [package report](../../issues/new?template=package-report.yml) with your device brand, model and OS version instead.

## Building the app

Requirements: Go 1.23+, Node.js with pnpm, and the Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0`).

```bash
wails dev     # live development
wails build   # build for the current OS into build/bin/
```

From macOS you can also build Windows with `wails build -platform windows/amd64`. Linux builds have to run on Linux (they link against GTK and WebKitGTK): install `libgtk-3-dev` and `libwebkit2gtk-4.1-dev`, then run `wails build -tags webkit2_41`.

## Changelog and releases

**You never pick a version number, and you never write a release date.**

If your pull request changes the app or its packages, add an entry under `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md), using a [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) heading in Spanish:

```markdown
## [Unreleased]

### Corregido
- The thing you fixed
```

CI fails a pull request that changes the app without a changelog entry. Changes to the package lists (`lists/`), Markdown files, `docs/`, `.github/` and `scripts/` are exempt, since they reach users without a release. To merge any other change without releasing it, a maintainer can add the `skip-changelog` label.

Merging to `main` then does the rest:

1. **Release** (`.github/workflows/release.yml`) reads `[Unreleased]` and derives the semver bump from its headings: `### Ruptura` → major, `### Añadido` → minor, anything else (`Corregido`, `Cambiado`, `Seguridad`, `Eliminado`) → patch. The English equivalents (`Breaking`, `Added`, …) also work.
2. It moves `[Unreleased]` into a dated `## [x.y.z]` section, sets `info.productVersion` in `wails.json`, adds the release to the AppStream metainfo, commits that to `main`, pushes the tag `vx.y.z` and opens a draft GitHub release with the notes.
3. **Publish** (`.github/workflows/publish.yml`) builds the tag for Linux (amd64, arm64, as `.tar.gz`, `.deb` and `.rpm`), macOS (universal) and Windows (amd64, arm64), uploads the files with `SHA256SUMS.txt`, and makes the release public.
4. This fork ships the artifacts as GitHub Release assets only. The Homebrew/Scoop/winget/Snap/Chocolatey channels from upstream were removed.

An empty `[Unreleased]` releases nothing, so merging and releasing stay separate decisions. To publish a tag again, run **Publish** from the Actions tab with that tag.

Preview what a merge would release:

```bash
go run ./scripts/release -dry-run
```

The bump logic lives in [`scripts/release`](scripts/release) and is unit-tested (`go test ./scripts/...`), because a mistake there silently ships the wrong version.

### Package manager setup

The `.deb` and `.rpm` are built straight from [`packaging/nfpm.yaml`](packaging/nfpm.yaml)
by the Publish workflow, so no package manager secrets are needed. Only one
optional secret remains:

| Secret | Channel | Setup |
|---|---|---|
| `RELEASE_TOKEN` (optional) | Release | Only needed if branch protection stops `github-actions[bot]` pushing the release commit to `main` |
