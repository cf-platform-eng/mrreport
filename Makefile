SHELL = /bin/bash
GO-VER = go1.12

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
SRC = $(shell find . -name "*.go" | grep -v "_test\." )

VERSION := $(or $(VERSION), "dev")

LDFLAGS="-X github.com/cf-platform-eng/mrreport/version.Version=$(VERSION)"

build/mrreport: $(SRC) deps
	go build -o build/mrreport -ldflags ${LDFLAGS} ./cmd/mrreport/main.go

build: build/mrreport

build-all: build-linux build-darwin

build-linux: build/mrreport-linux

build/mrreport-linux:
	GOARCH=amd64 GOOS=linux go build -o build/mrreport-linux -ldflags ${LDFLAGS} ./cmd/mrreport/main.go

build-darwin: build/mrreport-darwin

build/mrreport-darwin:
	GOARCH=amd64 GOOS=darwin go build -o build/mrreport-darwin -ldflags ${LDFLAGS} ./cmd/mrreport/main.go

units: deps
	ginkgo -r -skipPackage features .

features: deps
	ginkgo -r -tags=feature features

test: deps lint units features

lint: deps-goimports
	git ls-files | grep '.go$$' | xargs goimports -l -w
