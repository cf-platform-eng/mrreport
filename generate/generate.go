package generate

import (
	"io"
	"io/ioutil"
	"os"
)

type GenerateOpt struct {
}

func (cmd *GenerateOpt) Generate(in io.Reader, out io.WriteCloser) error {
	input, err := ioutil.ReadAll(in)
	if err != nil {
		return err
	}

	_, err = out.Write(input)
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

