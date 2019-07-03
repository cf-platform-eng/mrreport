package generate_test

import (
	"bytes"
	"errors"
	. "github.com/MakeNowJust/heredoc/dot"
	"github.com/cf-platform-eng/mrreport/generate"
	"github.com/cf-platform-eng/mrreport/generate/generatefakes"
	"github.com/gobuffalo/packr/v2"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gbytes"
	"text/template"
)

//go:generate counterfeiter io.Reader

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

	Context("index.html has a template error", func() {
		BeforeEach(func() {

			command = &generate.GenerateCommand{
				Box: packr.New("Report", "../html"),
				HTMLTemplate: &generatefakes.FakeTemplate{},
			}
		})

		It("returns an error", func() {
			output := NewBuffer()
			err := command.Generate(bytes.NewBufferString("log"), output)

			Expect(err).To(HaveOccurred())
		})
	})

})
