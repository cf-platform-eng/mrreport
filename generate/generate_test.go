package generate_test

import (
	"bytes"
	"errors"
	. "github.com/MakeNowJust/heredoc/dot"
	"github.com/cf-platform-eng/mrreport/generate"
	"github.com/cf-platform-eng/mrreport/generate/generatefakes"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gbytes"
)

//go:generate counterfeiter io.Reader

var _ = Describe("Generate", func() {
	var (
		command *generate.GenerateCommand
	)

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

	Context("Packr cannot find index.html", func() {
	})
})
