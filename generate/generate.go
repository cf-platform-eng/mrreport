package generate

import (
	"github.com/gobuffalo/packr/v2"
	"io"
	"io/ioutil"
	"os"
)

type GenerateOpt struct {

}

func (cmd *GenerateOpt) Generate(in io.Reader, out io.WriteCloser) error {
	_, err := ioutil.ReadAll(in)
	if err != nil {
		return err
	}

	box := packr.New("Report", "../html")
	index, err := box.Find("index.html")

	_, err = out.Write(index)
	if err != nil {
		return err
	}

	err = out.Close()
	if err != nil {
		return err
	}

	return nil
}

func (cmd *GenerateOpt) Execute(args []string) error {
	return cmd.Generate(os.Stdin, os.Stdout)
}

