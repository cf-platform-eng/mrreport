package features_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	"github.com/sclevine/agouti"
)

func TestFeatures(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Features Suite")
}

func serveDocument(document string) *httptest.Server {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, err := fmt.Fprint(w, document)
		Expect(err).NotTo(HaveOccurred())
	}))

	return testServer
}

func configureAgouti(headless bool) error {
	agoutiDriver = agouti.ChromeDriver()
	Expect(agoutiDriver.Start()).To(Succeed())

	var err error
	if headless {
		fmt.Println("Running feature tests in headless mode")
		page, err = agouti.NewPage(
			agoutiDriver.URL(),
			agouti.Desired(agouti.Capabilities{
				"chromeOptions": map[string][]string{
					"args": {
						"headless",
						"disable-gpu", // There is no GPU on our Ubuntu box!
						"no-sandbox",  // Sandbox requires namespace permissions that we don't have on a container
					},
				},
			}),
		)
	} else {
		page, err = agoutiDriver.NewPage(agouti.Browser("chrome"))
	}

	return err
}

var (
	page         *agouti.Page
	agoutiDriver *agouti.WebDriver
)

var _ = BeforeSuite(func() {
	_, ciMode := os.LookupEnv("CI")

	err := configureAgouti(ciMode)
	Expect(err).NotTo(HaveOccurred())
})

var _ = AfterSuite(func() {
	if page != nil {
		Expect(page.Destroy()).To(Succeed())
	}

	if agoutiDriver != nil {
		Expect(agoutiDriver.Stop()).To(Succeed())
	}

})
