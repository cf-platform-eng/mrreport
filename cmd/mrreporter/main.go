package main

import (
	"fmt"
	"github.com/cf-platform-eng/mrreport"
	"github.com/cf-platform-eng/mrreport/generate"
	"os"

	"github.com/jessevdk/go-flags"

	"github.com/cf-platform-eng/mrreport/version"
)

var config mrreport.Config
var parser = flags.NewParser(&config, flags.Default)

func main() {
	_, err := parser.AddCommand(
		"generate",
		"generate the report",
		"generate a report from your test-case logging",
		&generate.GenerateOpt{})
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
