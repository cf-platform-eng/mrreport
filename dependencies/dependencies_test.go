package dependencies_test

import (
	"bytes"
	"errors"
	. "github.com/MakeNowJust/heredoc/dot"
	"github.com/cf-platform-eng/mrreport/dependencies"
	"github.com/cf-platform-eng/mrreport/dependencies/dependenciesfakes"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/onsi/gomega/gbytes"
)

//go:generate counterfeiter io.Reader
//go:generate counterfeiter io.WriteCloser

var _ = Describe("Dependencies", func() {
	var (
		command *dependencies.DependenciesCommand
	)

	BeforeEach(func() {
		command = &dependencies.DependenciesCommand{}
	})

	Context("Log has dependencies", func() {
		var (
			reader *bytes.Buffer
		)

		BeforeEach(func() {
			reader = bytes.NewBufferString(D(`
				this is the log
				Here is a dependency
				dependency: 'uaac' version '4.1.0' MRL:{"type":"dependency","version":"4.1.0","name":"uaac","time":"2019-07-16T19:46:20.490884996Z"}
				dependency: 'something-else' version '1.2.3' MRL:{"type":"dependency","version":"1.2.3","name":"something-else","time":"2019-07-16T19:46:20.490884996Z"}
				That was the dependency
			`))
		})

		It("outputs only the logged dependencies", func() {
			output := NewBuffer()
			err := command.Filter(reader, output)
			Expect(err).ToNot(HaveOccurred())
			Expect(output).To(Say(`dependency: 'uaac' version '4.1.0' MRL:{"type":"dependency","version":"4.1.0","name":"uaac","time":"2019-07-16T19:46:20.490884996Z"}\n`))
			Expect(output).To(Say(`dependency: 'something-else' version '1.2.3' MRL:{"type":"dependency","version":"1.2.3","name":"something-else","time":"2019-07-16T19:46:20.490884996Z"}\n`))
		})
	})

	Context("Log has no dependencies", func() {
		var (
			reader *bytes.Buffer
		)

		BeforeEach(func() {
			reader = bytes.NewBufferString(D(`
				this is the log
				it has multiple lines
				but none of them are dependencies
			`))
		})

		It("outputs nothing", func() {
			output := NewBuffer()
			err := command.Filter(reader, output)
			Expect(err).ToNot(HaveOccurred())
			Expect(output.Contents()).To(BeEmpty())
		})
	})

	Context("failed to read log", func() {
		var (
			reader *dependenciesfakes.FakeReader
		)

		BeforeEach(func() {
			readError := errors.New("read error")
			reader = &dependenciesfakes.FakeReader{}
			reader.ReadReturns(0, readError)
		})

		It("returns an error", func() {
			output := NewBuffer()
			err := command.Filter(reader, output)

			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("error reading from stdin"))
		})
	})

	Context("cannot write to output", func() {
		var (
			output *dependenciesfakes.FakeWriteCloser
			reader *bytes.Buffer
		)

		BeforeEach(func() {
			output = &dependenciesfakes.FakeWriteCloser{}
			output.WriteReturns(0, errors.New("couldn't write"))
			reader = bytes.NewBufferString(D(`
				this is the log
				Here is a dependency
				dependency: 'uaac' version '4.1.0' MRL:{"type":"dependency","version":"4.1.0","name":"uaac","time":"2019-07-16T19:46:20.490884996Z"}
				dependency: 'something-else' version '1.2.3' MRL:{"type":"dependency","version":"1.2.3","name":"something-else","time":"2019-07-16T19:46:20.490884996Z"}
				That was the dependency
			`))
		})

		It("returns an error", func() {
			err := command.Filter(reader, output)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("couldn't write"))
			Expect(err.Error()).To(ContainSubstring("failed to write to the output file"))
		})
	})

	Context("cannot close output", func() {
		var (
			output *dependenciesfakes.FakeWriteCloser
		)
		BeforeEach(func() {
			output = &dependenciesfakes.FakeWriteCloser{}
			output.CloseReturns(errors.New("couldn't close"))
		})

		It("returns an error", func() {
			err := command.Filter(bytes.NewBufferString("log"), output)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("couldn't close"))
			Expect(err.Error()).To(ContainSubstring("was unable to close the output file"))
		})
	})
})
