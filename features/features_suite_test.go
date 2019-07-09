package features_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	"github.com/sclevine/agouti"
)

func TestFeatures(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Features Suite")
}

var agoutiDriver *agouti.WebDriver

var _ = BeforeSuite(func() {
	agoutiDriver = agouti.ChromeDriver()

	Expect(agoutiDriver.Start()).To(Succeed())
})

var _ = AfterSuite(func() {
	Expect(agoutiDriver.Stop()).To(Succeed())
})

func serveDocument(document string) *httptest.Server {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, err := fmt.Fprint(w, document)
		Expect(err).NotTo(HaveOccurred())
	}))

	return testServer
}


