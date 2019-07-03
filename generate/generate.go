package generate

import (
	"github.com/gobuffalo/packr/v2"
	"github.com/pkg/errors"
	"io"
	"io/ioutil"
	"os"
	"text/template"
)

//go:generate counterfeiter Box
type Box interface {
	FindString(name string) (string, error)
}

//go:generate counterfeiter Template
type Template interface {
	Execute(wr io.Writer, data interface{}) error
	Parse(text string) (*template.Template, error)
}

type GenerateCommand struct {
	Box          Box
	HTMLTemplate Template
}

func NewGenerateCommand() *GenerateCommand {
	return &GenerateCommand{
		Box: packr.New("Report", "../html"),
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

	vars := &templateVariables{string(logData)}
	_ = htmlTemplate.Execute(out, vars)
	_ = out.Close()

	return nil
}

func (cmd *GenerateCommand) Execute(args []string) error {
	return cmd.Generate(os.Stdin, os.Stdout)
}
