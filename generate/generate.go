package generate

import (
	"io"
	"io/ioutil"
	"os"
	"text/template"

	"github.com/gobuffalo/packr/v2"
	"github.com/pkg/errors"
)

//go:generate counterfeiter Box
type Box interface {
	FindString(name string) (string, error)
}

type GenerateCommand struct {
	Box          Box
	HTMLTemplate *template.Template
}

func NewGenerateCommand() *GenerateCommand {
	return &GenerateCommand{
		Box:          packr.New("Report", "../html"),
		HTMLTemplate: template.New("html"),
	}
}

type templateVariables struct {
	LogData string
}

func (cmd *GenerateCommand) Generate(in io.Reader, out io.WriteCloser) error {
	logData, err := ioutil.ReadAll(in)
	if err != nil {
		return errors.Wrap(err, "error reading from stdin")
	}

	html, err := cmd.Box.FindString("index.html")
	if err != nil {
		return errors.Wrap(err, "packr could not find index.html")
	}

	htmlTemplate, err := cmd.HTMLTemplate.Parse(html)
	if err != nil {
		return errors.Wrap(err, "could not parse index.html template")
	}

	vars := &templateVariables{string(logData)}
	err = htmlTemplate.Execute(out, vars)
	if err != nil { // !branch-not-tested we know of no way for this to occur.
		return errors.Wrap(err, "highly unexpected error")
	}

	err = out.Close()
	if err != nil {
		return errors.Wrap(err, "was unable to close the output file")
	}

	return nil
}

func (cmd *GenerateCommand) Execute(args []string) error {
	return cmd.Generate(os.Stdin, os.Stdout)
}
