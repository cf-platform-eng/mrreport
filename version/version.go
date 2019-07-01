package version

import (
	"fmt"
	"github.com/cf-platform-eng/mrreporter"
)

type VersionOpt struct {
}

var Version = "dev"

func (_ *VersionOpt) Execute(args []string) error {
	fmt.Printf("%s version: %s\n", mrreporter.APP_NAME, Version)
	return nil
}
