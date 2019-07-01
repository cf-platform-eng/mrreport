package main

import (
	"fmt"
	"github.com/cf-platform-eng/mrreporter"
	"os"

	"github.com/jessevdk/go-flags"

	"github.com/cf-platform-eng/mrreporter/version"
)

var config mrreporter.Config
var parser = flags.NewParser(&config, flags.Default)

func main() {
	_, err := parser.AddCommand(
		"version",
		"print version",
		fmt.Sprintf("print %s version", mrreporter.APP_NAME),
		&version.VersionOpt{})
	if err != nil {
		fmt.Println("Could not add version command")
		os.Exit(1)
	}

	_, err = parser.Parse()
	if err != nil {
		os.Exit(1)
	}
}
