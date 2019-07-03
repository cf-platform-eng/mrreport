package generate_test

import (
	"bytes"
	"errors"
	"text/template"

	. "github.com/MakeNowJust/heredoc/dot"
	"github.com/cf-platform-eng/mrreport/generate"
	"github.com/cf-platform-eng/mrreport/generate/generatefakes"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gbytes"
)

//go:generate counterfeiter io.Reader
//go:generate counterfeiter io.WriteCloser

var _ = Describe("Generate", func() {
	var (
		command *generate.GenerateCommand
	)

	BeforeEach(func() {
		command = generate.NewGenerateCommand()
	})

	Context("reader has logging data", func() {
		var (
			reader *bytes.Buffer
		)

		BeforeEach(func() {
			reader = bytes.NewBufferString(D(`
				this is the log
				it has multiple lines
			`))
		})

		It("inserts the log as a variable into logging page", func() {
			output := NewBuffer()
			err := command.Generate(reader, output)

			Expect(err).NotTo(HaveOccurred())
			Expect(output).To(Say("this is the log"))
		})
	})

	Context("input has a read error", func() {
		var (
			reader *generatefakes.FakeReader
		)

		BeforeEach(func() {
			readError := errors.New("read error")
			reader = &generatefakes.FakeReader{}
			reader.ReadReturns(0, readError)
		})

		It("returns the error", func() {
			output := NewBuffer()
			err := command.Generate(reader, output)

			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("error reading from stdin"))
		})
	})

	Context("packr box cannot find index.html", func() {
		BeforeEach(func() {
			box := &generatefakes.FakeBox{}

			box.FindStringReturns("", errors.New("find string error"))

			command = &generate.GenerateCommand{
				Box:          box,
				HTMLTemplate: template.New("html"),
			}
		})

		It("returns an error", func() {
			output := NewBuffer()
			err := command.Generate(bytes.NewBufferString("log"), output)

			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("packr could not find index.html"))
			Expect(err.Error()).To(ContainSubstring("find string error"))
		})
	})

	Context("template cannot be parsed", func() {
		BeforeEach(func() {
			box := &generatefakes.FakeBox{}

			box.FindStringReturns("{{ illegal {{ nesting }} }}", nil)

			command = generate.NewGenerateCommand()
			command.Box = box
		})

		It("returns an error", func() {
			output := NewBuffer()
			err := command.Generate(bytes.NewBufferString("log"), output)

			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("could not parse index.html template"))
			Expect(err.Error()).To(ContainSubstring("function \"illegal\" not defined"))
		})
	})

	Context("cannot close output", func() {
		var (
			output *generatefakes.FakeWriteCloser
		)
		BeforeEach(func() {
			output = &generatefakes.FakeWriteCloser{}
			output.CloseReturns(errors.New("couldn't close"))
		})

		It("returns an error", func() {
			err := command.Generate(bytes.NewBufferString("log"), output)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("couldn't close"))
			Expect(err.Error()).To(ContainSubstring("was unable to close the output file"))
		})
	})
})
