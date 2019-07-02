package generate_test

import (
	"bytes"
	. "github.com/MakeNowJust/heredoc/dot"
	"github.com/cf-platform-eng/mrreport/generate"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gbytes"
)

var _ = Describe("Generate", func() {
	It("inserts the log as a variable", func() {
		logIn := bytes.NewBufferString(D(`
			this is the log
			it has multiple lines
		`))

		config := generate.GenerateOpt{}

		output := NewBuffer()
		result := config.Generate(logIn, output)

		Expect(result).To(BeNil())
		Expect(output).To(Say("this is the log"))
	})

	It("embeds the logging system", func() {

	})

	It("calls the logging system with the log", func() {

	})
})
