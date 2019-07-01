package generate_test

import (
	"bytes"
	. "github.com/MakeNowJust/heredoc/dot"
	"github.com/cf-platform-eng/mrreporter/generate"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	"os"
)

var _ = Describe("Generate", func() {
	It("inserts the log as a variable", func() {
		logIn := bytes.NewBufferString(D(`
			this is the log
			it has multiple lines
		`))

		config := generate.GenerateOpt{}
		result := config.Generate(logIn, os.Stdout)

		Expect(result).To(BeNil())
	})

	It("embeds the logging system", func() {

	})

	It("calls the logging system with the log", func() {

	})
})
