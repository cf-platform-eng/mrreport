// +build feature

package features_test

import (
	"bytes"
	"os/exec"

	"github.com/MakeNowJust/heredoc"
	. "github.com/MakeNowJust/heredoc/dot"
	. "github.com/bunniesandbeatings/goerkin"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gbytes"
	"github.com/onsi/gomega/gexec"
	. "github.com/sclevine/agouti/matchers"
)

var _ = Describe("Generate HTML log", func() {
	steps := NewSteps()

	Scenario("Log contains simple text", func() {
		steps.Given("the mrreport command is built")
		steps.And("a simple log output as a stream")
		steps.When("I pipe the log output into the generate command")

		steps.Then("the command exits without error")
		steps.And("the result including the simple log is on stdout")
		steps.And("the result is a html page displaying the simple log")
	})

	Scenario("Log contains an end-script tag", func() {
		steps.Given("the mrreport command is built")
		steps.And("a log output with an end-script tag, as a stream")
		steps.When("I pipe the log output into the generate command")

		steps.Then("the command exits without error")
		steps.And("the result including the end-script tag is on stdout")
		steps.And("the result is a html page displaying the end-script tag and the rest of the log")
	})

	Scenario("Log contains errors", func() {
		steps.Given("the mrreport command is built")
		steps.And("a log with an error in it, as a stream")
		steps.When("I pipe the log output into the generate command")

		steps.Then("the command exits without error")
		steps.And("the result including the failure section is on stdout")
		steps.And("the result is a html page displaying the failure section and the rest of the log")
	})

	Scenario("Click on error expands section", func() {
		steps.Given("the mrreport command is built")
		steps.And("a log with an error in it, as a stream")
		steps.When("I pipe the log output into the generate command")

		steps.Then("the command exits without error")
		steps.And("the result is a html page displaying the failure links and the folded logs")
		steps.And("when the failure link is clicked, the failure section is expanded")
	})

	Scenario("Click on error expands nested sections to display error", func() {
		steps.Given("the mrreport command is built")
		steps.And("a log with a nested error in it, as a stream")
		steps.When("I pipe the log output into the generate command")

		steps.Then("the command exits without error")
		steps.And("the result is a html page displaying the nested failure links and the folded logs")
		steps.And("when the nested failure link is clicked, the failure section and its parent are expanded")
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

		define.Given(`^a simple log output as a stream$`, func() {
			logStream = bytes.NewBufferString(D(`
				this is the log
				it has multiple lines
			`))
		})

		define.Given(`^a log output with an end-script tag, as a stream$`, func() {
			logStream = bytes.NewBufferString(
				D(`</script>This log tells you about some <pre id="not_in_doc">html you need</pre>`))
		})

		define.Given(`^a log with an error in it, as a stream$`, func() {
			logStream = bytes.NewBufferString(D(`
				===== 2019-08-14 15:31:29 UTC Running "an operation"
				Operation failed
				===== 2019-08-14 15:32:21 UTC Finished "an operation"; Duration: 52s; Exit Status: 1
			`))
		})

		define.Given(`^a log with a nested error in it, as a stream$`, func() {
			logStream = bytes.NewBufferString(D(`
				section-start: 'outer operation' MRL:{"type":"section-start","name":"outer operation","time":"2019-08-12T23:29:56.8591096Z"}
				===== 2019-08-14 15:31:29 UTC Running "inner operation"
				Operation failed
				===== 2019-08-14 15:32:21 UTC Finished "inner operation"; Duration: 52s; Exit Status: 1
				section-end: 'outer operation' result: 0 MRL:{"type":"section-end","name":"outer operation","time":"2019-08-12T23:29:57.0448313Z"}
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

		define.Then(`^the result including the simple log is on stdout$`, func() {
			Eventually(commandSession.Out).Should(Say("this is the log"))
			Eventually(commandSession.Out).Should(Say("it has multiple lines"))
		})

		define.Then(`^the result including the end-script tag is on stdout$`, func() {
			Eventually(commandSession.Out).Should(Say(
				"&lt;/script&gt;This log tells you about some &lt;pre id=&#34;not_in_doc&#34;&gt;html you need&lt;/pre&gt;"))
		})

		define.Then(`^the result including the failure section is on stdout$`, func() {
			Eventually(commandSession.Out).Should(Say(
				"===== 2019-08-14 15:31:29 UTC Running &#34;an operation&#34;"))
			Eventually(commandSession.Out).Should(Say(
				"Operation failed"))
			Eventually(commandSession.Out).Should(Say(
				"===== 2019-08-14 15:32:21 UTC Finished &#34;an operation&#34;; Duration: 52s; Exit Status: 1"))
		})

		define.Then(`^the result is a html page displaying the simple log$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("#display")).To(HaveText(heredoc.Doc(
				`Log
				this is the log
				it has multiple lines`,
			)))
		})

		define.Then(`^the result is a html page displaying the end-script tag and the rest of the log$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("#display")).To(HaveText(heredoc.Doc(
				`Log
				</script>This log tells you about some <pre id="not_in_doc">html you need</pre>`,
			)))
		})

		define.Then(`^the result is a html page displaying the failure section and the rest of the log$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("summary").Click()).To(Succeed())
			Expect(page.Find("#display")).To(HaveText(heredoc.Doc(
				`Failures
				an operation
				Log
				an operation [failed]
				Begin section an operation
				===== 2019-08-14 15:31:29 UTC Running "an operation"
				Operation failed
				===== 2019-08-14 15:32:21 UTC Finished "an operation"; Duration: 52s; Exit Status: 1
				End section an operation`,
			)))
		})

		define.Then(`^the result is a html page displaying the failure links and the folded logs$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("#an_operation").Count()).To(Equal(1))
			Expect(page.Find("#an_operation_end").Count()).To(Equal(1))
			Expect(page.FindByXPath("//*[@id='an_operation'][@open]")).NotTo(BeFound())
		})

		define.Then(`^the result is a html page displaying the nested failure links and the folded logs$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("#inner_operation").Count()).To(Equal(1))
			Expect(page.Find("#inner_operation_end").Count()).To(Equal(1))
			Expect(page.FindByXPath("//*[@id='inner_operation'][@open]")).NotTo(BeFound())
		})

		define.Then(`^when the failure link is clicked, the failure section is expanded$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("a").Click()).To(Succeed())
			Expect(page.FindByXPath("//*[@id='an_operation'][@open]")).To(BeFound())
		})

		define.Then(`^when the nested failure link is clicked, the failure section and its parent are expanded$`, func() {
			html := string(commandSession.Out.Contents())

			server := serveDocument(html)
			defer server.Close()

			Expect(page.Navigate(server.URL)).To(Succeed())
			Expect(page.Find("a").Click()).To(Succeed())
			Expect(page.AllByXPath("//*[@open]").Count()).To(Equal(2))
			Expect(page.FindByXPath("//*[@id='inner_operation'][@open]")).To(BeFound())
		})
	})
})
