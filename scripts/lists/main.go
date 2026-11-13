package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}
	root, err := repoRoot()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	switch os.Args[1] {
	case "validate":
		if errs := validateRepo(root); len(errs) > 0 {
			for _, e := range errs {
				fmt.Fprintln(os.Stderr, "✖", e)
			}
			os.Exit(1)
		}
		fmt.Println("✔ listas válidas")
	case "checkfile":
		if len(os.Args) < 3 {
			fmt.Fprintln(os.Stderr, "uso: lists checkfile <archivo.json>")
			os.Exit(2)
		}
		path := os.Args[2]
		if !filepath.IsAbs(path) {
			path = filepath.Join(root, path)
		}
		list, err := loadListFile(path)
		if err != nil {
			fmt.Fprintln(os.Stderr, "✖", err)
			os.Exit(1)
		}
		if errs := validateEntries(list, filepath.Base(path)); len(errs) > 0 {
			for _, e := range errs {
				fmt.Fprintln(os.Stderr, "✖", e)
			}
			os.Exit(1)
		}
		fmt.Printf("✔ %s válido (%d paquetes)\n", filepath.Base(path), len(list.Packages))
	case "sync":
		if err := syncManifest(root); err != nil {
			fmt.Fprintln(os.Stderr, "✖", err)
			os.Exit(1)
		}
		fmt.Println("✔ manifest.json sincronizado")
	default:
		usage()
		os.Exit(2)
	}
}

func usage() {
	fmt.Println(`uso: lists <comando>

Comandos:
  validate           valida manifest.json, todas las listas y su consistencia
  checkfile <json>   valida el esquema de un solo archivo de lista
  sync               sincroniza versiones y conteos del manifest con los archivos`)
}
