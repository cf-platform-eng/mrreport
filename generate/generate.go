package generate

import (
	"io"
	"os"
)

type GenerateOpt struct {
}

func (cmd *GenerateOpt) Generate(in io.Reader, out io.WriteCloser) error {
	return nil
}

func (cmd *GenerateOpt) Execute(args []string) error {
	return cmd.Generate(os.Stdin, os.Stdout)
}

