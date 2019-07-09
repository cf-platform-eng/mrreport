// +build feature

package features_test

import (
	"bytes"
	"os/exec"

	. "github.com/MakeNowJust/heredoc/dot"
	. "github.com/bunniesandbeatings/goerkin"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gbytes"
	"github.com/onsi/gomega/gexec"
	"github.com/sclevine/agouti"
	"github.com/sclevine/agouti/matchers"
)

var _ = Describe("Generate HTML log", func() {
	steps := NewSteps()

	var (
		page *agouti.Page
	)

	BeforeEach(func() {
		var err error
		page, err = agoutiDriver.NewPage()
		Expect(err).NotTo(HaveOccurred())
	})

	AfterEach(func() {
		Expect(page.Destroy()).To(Succeed())
	})


	Scenario("Happy path, log contains simple text", func() {
		steps.Given("the mrreport command is built")
		steps.And("a log output as a stream")
		steps.When("I pipe the log output into the generate command")

		steps.Then("the command exits without error")
		steps.And("the result is on stdout")
		steps.And("the result is a html page displaying the log")
	})

	steps.Define(func(define Definitions) {
		var (
			logStream      *bytes.Buffer
			pathToMRReport string
			commandSession *gexec.Session
		)

		define.Given(`^the mrreport command is built$`, func() {
			var err error
			pathToMRReport, err = gexec.Build("github.com/cf-platform-eng/mrreport/cmd/mrreport")
			Expect(err).NotTo(HaveOccurred())
		}, func() {
			gexec.CleanupBuildArtifacts()
		})

		define.Given(`^a log output as a stream$`, func() {
			logStream = bytes.NewBufferString(D(`
				this is the log
				it has multiple lines
			`))
		})

		define.When(`^I pipe the log output into the generate command$`, func() {
			generateCommand := exec.Command(pathToMRReport, "generate")
			generateCommand.Stdin = logStream
			var err error
			commandSession, err = gexec.Start(generateCommand, GinkgoWriter, GinkgoWriter)
			Expect(err).NotTo(HaveOccurred())
		})

		define.Then(`^the command exits without error$`, func() {
			Eventually(commandSession).Should(gexec.Exit(0))
		})

		define.Then(`^the result is on stdout$`, func() {
			Eventually(commandSession.Out).Should(Say("this is the log"))
			Eventually(commandSession.Out).Should(Say("it has multiple lines"))
		})

		define.Then(`^the result is a html page displaying the log$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("#display")).To(matchers.HaveText("this is the log\nit has multiple lines"))
		}, func() {
		})
	})
})
