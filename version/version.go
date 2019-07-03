package version

import (
	"fmt"

	"github.com/cf-platform-eng/mrreport"
)

type VersionOpt struct {
}

var Version = "dev"

func (_ *VersionOpt) Execute(args []string) error {
	fmt.Printf("%s version: %s\n", mrreport.APP_NAME, Version)
	return nil
}
