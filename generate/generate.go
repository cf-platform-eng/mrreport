package generate

import (
	"github.com/gobuffalo/packr/v2"
	"github.com/pkg/errors"
	"io"
	"io/ioutil"
	"os"
	"text/template"
)

type GenerateCommand struct {
}

type templateVariables struct {
	LogData string
}

func (cmd *GenerateCommand) Generate(in io.Reader, out io.WriteCloser) error {
	logData, err := ioutil.ReadAll(in)
	if err != nil {
		return errors.Wrap(err, "error reading from stdin")
	}

	box := packr.New("Report", "../html")
	html, err := box.FindString("index.html")
	// !branch-not-tested requires dep injection of a static, immutable in-memory db
	if err != nil {
		return errors.Wrap(err, "packr could not find index.html")
	}

	htmlTemplate, err := template.New("html").Parse(html)
	if err != nil {
		return err
	}

	vars := &templateVariables{string(logData)}
	_ = htmlTemplate.Execute(out, vars)
	_ = out.Close()

	return nil
}

func (cmd *GenerateCommand) Execute(args []string) error {
	return cmd.Generate(os.Stdin, os.Stdout)
}
