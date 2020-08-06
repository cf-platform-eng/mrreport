SHELL = /bin/bash
GO-VER = go1.14

default: build

# #### GO Binary Management ####

deps-go-binary:
	echo "Expect: $(GO-VER)" && \
		echo "Actual: $$(go version)" && \
	 	go version | grep $(GO-VER) > /dev/null

HAS_GO_IMPORTS := $(shell command -v goimports;)

deps-goimports: deps-go-binary
ifndef HAS_GO_IMPORTS
	go get -u golang.org/x/tools/cmd/goimports
endif


# #### CLEAN ####

clean-packr: deps-packr
	packr2 clean

clean: deps-go-binary clean-packr
	rm -rf build/*
	go clean --modcache

# #### DEPS ####

deps-modules: deps-goimports deps-go-binary
	go mod download

deps-packr: deps-modules
	command -v packr2 >/dev/null 2>&1 || go get -u github.com/gobuffalo/packr/v2/packr2

deps-counterfeiter: deps-modules
	command -v counterfeiter >/dev/null 2>&1 || go get -u github.com/maxbrunsfeld/counterfeiter/v6

deps: deps-modules deps-packr deps-counterfeiter


# #### BUILD ####

GENERATE_ARTIFACTS = generate/generate-packr.go packrd/packed-packr.go
SRC = $(shell find . -name "*.go" | grep -v "_test\." )
VERSION := $(or $(VERSION), "dev")
LDFLAGS="-X github.com/cf-platform-eng/mrreport/version.Version=$(VERSION)"

$(GENERATE_ARTIFACTS): html/index.html html/presenter.js
	packr2 build

build/mrreport: $(SRC) $(GENERATE_ARTIFACTS)
	go build -o build/mrreport -ldflags ${LDFLAGS} ./cmd/mrreport/main.go

build: deps build/mrreport

build/mrreport-linux: $(SRC) $(GENERATE_ARTIFACTS)
	GOARCH=amd64 GOOS=linux go build -o build/mrreport-linux -ldflags ${LDFLAGS} ./cmd/mrreport/main.go

build-linux: deps build/mrreport-linux

build/mrreport-darwin: $(SRC) $(GENERATE_ARTIFACTS)
	GOARCH=amd64 GOOS=darwin go build -o build/mrreport-darwin -ldflags ${LDFLAGS} ./cmd/mrreport/main.go

build-darwin: deps build/mrreport-darwin

build-all: build-linux build-darwin


# #### TESTS ####

units: deps # units test without packr content
	ginkgo -r -tags=skippackr -skipPackage features .

features: deps $(GENERATE_ARTIFACTS)
	ginkgo -r -tags=feature features

test: deps lint units features

lint: deps-goimports
	git ls-files | grep '.go$$' | xargs goimports -l -w
