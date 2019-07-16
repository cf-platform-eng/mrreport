package dependencies

import (
	"fmt"
	"github.com/pkg/errors"
	"io"
	"io/ioutil"
	"os"
	"regexp"
)

type DependenciesCommand struct {}

func (cmd *DependenciesCommand) Filter(in io.Reader, out io.WriteCloser) error {
	logData, err := ioutil.ReadAll(in)
	if err != nil {
		return errors.Wrap(err, "error reading from stdin")
	}

	pattern, err := regexp.Compile("dependency: .*")
	if err != nil { // !branch-not-tested we know of no way for this to occur.
		return errors.Wrap(err, "error building the regex")
	}

	matches := pattern.FindAll(logData, -1)

	for _, match := range matches {
		_, err = fmt.Fprintf(out, "%s\n", string(match))
		if err != nil {
			return errors.Wrap(err, "failed to write to the output file")
		}
	}

	err = out.Close()
	if err != nil {
		return errors.Wrap(err, "was unable to close the output file")
	}

	return nil
}

func (cmd *DependenciesCommand) Execute(args []string) error {
	return cmd.Filter(os.Stdin, os.Stdout)
}
