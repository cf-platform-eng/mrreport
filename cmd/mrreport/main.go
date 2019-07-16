package main

import (
	"fmt"
	"os"

	"github.com/cf-platform-eng/mrreport"
	"github.com/cf-platform-eng/mrreport/dependencies"
	"github.com/cf-platform-eng/mrreport/generate"
	"github.com/cf-platform-eng/mrreport/version"

	"github.com/jessevdk/go-flags"
)

var config mrreport.Config
var parser = flags.NewParser(&config, flags.Default)

func main() {
	_, err := parser.AddCommand(
		"dependencies",
		"show logged dependencies",
		"filter the logs to show only the dependencies",
		&dependencies.DependenciesCommand{})
	if err != nil {
		fmt.Println("Could not add dependencies command")
		os.Exit(1)
	}

	_, err = parser.AddCommand(
		"generate",
		"generate the report",
		"generate a report from your test-case logging",
		generate.NewGenerateCommand())
	if err != nil {
		fmt.Println("Could not add generate command")
		os.Exit(1)
	}

	_, err = parser.AddCommand(
		"version",
		"print version",
		fmt.Sprintf("print %s version", mrreport.APP_NAME),
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
