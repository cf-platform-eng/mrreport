const fs = require("fs");
const { promisify, inspect } = require("util");
const readFile = promisify(fs.readFile);
let presenter = require("../presenter.js");

document = {
    getElementById: (elementId) => {}
};

describe("injectElements", () => {
    let logDataElement = {};
    let displayElement = {
        get innerHTML() {
        },
        set innerHTML(v) {
        },
    };

    let getElementById;
    let displayInnerHTML;

    beforeEach(() => {
        displayInnerHTML = spyOnProperty(displayElement, "innerHTML", "set");
        getElementById = spyOn(document, 'getElementById').and.returnValues(logDataElement, displayElement);
    });

    it("populates the display with the log data", () => {
        logDataElement.innerHTML = "this is my log";

        presenter.injectElements();

        expect(getElementById).toHaveBeenCalledWith("logData");
        expect(getElementById).toHaveBeenCalledWith("display");
        expect(displayInnerHTML).toHaveBeenCalledWith("<div><h1>Log</h1>this is my log</div>");
    });

    it("populates the display with decoded log data", () => {
        logDataElement.innerHTML = 'this &#34;is&#34; my log';
        presenter.injectElements();

        expect(getElementById).toHaveBeenCalledWith("logData");
        expect(getElementById).toHaveBeenCalledWith("display");
        expect(displayInnerHTML).toHaveBeenCalledWith('<div><h1>Log</h1>this "is" my log</div>');

    })
});

describe("parseLogData", () => {
    describe("when there are no sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/no_markers.log');
        });

        it("returns the whole log", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(1);
            expect(parsed[0].contents).toContain("Pulling amidos/dcind@sha256:fb793c416c7aebaf56dfb936d4f09124666d25eb53ac4bd573877fc06dd6b561...")
            expect(parsed[0].contents).toContain("sha256:fb793c416c7aebaf56dfb936d4f09124666d25eb53ac4bd573877fc06dd6b561: Pulling from amidos/dcind")
        })
    })
    describe("when there are sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/flat_markers.log');
        });

        it("splits based on tags into array of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(6);
            expect(parsed[0].contents).toBe("UUDDLRLRBA0\n\n")
            expect(parsed[1].name).toBe("pull")
            expect(parsed[2].name).toBe("pull2")
            expect(parsed[2].contents.length).toBe(1)
            expect(parsed[2].contents[0].contents).toBe("UUDDLRLRBA1\n")
            expect(parsed[3].contents).toBe("\n")
            expect(parsed[4].name).toBe("pull3")
            expect(parsed[4].contents.length).toBe(1)
            expect(parsed[4].contents[0].contents).toBe("UUDDLRLRBA2\n")
        });
    });

    describe("when there are nested sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/nested_markers.log');
        });

        it("returns nested arrays of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(4);
            expect(parsed[0].contents).toContain("UUDDLRLRBA0\n");
            expect(parsed[1].contents.length).toBe(5)
            expect(parsed[1].name).toBe("pull")
            expect(parsed[1].statusCode).toBe("0")
            expect(parsed[2].name).toBe("pull2")
            expect(parsed[2].statusCode).toBe("2")
            expect(parsed[3].contents).toContain("apk add jq")
            expect(parsed[3].contents).toContain("fetch http://dl-cdn.alpinelinux.org/alpine/v3.10/main/x86_64/APKINDEX.tar.gz")
        });

        it("returns twice nested arrays of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(4);
            expect(parsed[1].name).toBe("pull")
            const pull = parsed[1]
            expect(pull.contents.length).toBe(5);
            expect(pull.contents[1].name).toBe("nestedpull")
            expect(pull.contents[1].contents[0].contents).toContain("UUDDLRLRBA1");
            expect(pull.contents[3].name).toBe("nestedpull2")
            nestedPull2 = pull.contents[3]
            expect(nestedPull2.contents.length).toBe(1)
            expect(nestedPull2.contents[0].name).toBe("twicenestedpull")
        });

        it("returns strings between objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(4);
            expect(parsed[1].contents.length).toBe(5);
            expect(parsed[1].contents[2].contents).toContain("hello from the middle");
        });
    });

    describe("when last line has no newline", () => {
        let rawLogData
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/no_final_newline.log')
        })
        it("returns last line when it doesn't finish with a newline", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(1);
            expect(parsed[0].contents).toContain("sha256:fb793c416c7aebaf56dfb936d4f09124666d25eb53ac4bd573877fc06dd6b561: Pulling from amidos/dcind")
        })
    })

    describe("handles double marker opsman log section", () => {
        let rawLogData
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/an_opsman_section.log')
        })

        it("returns a single opsman section", () => {
            let parsed = presenter.parseLogData(rawLogData)
            expect(parsed.length).toBe(1)
            expect(parsed[0].name).toBe("Installing BOSH")
            expect(parsed[0].contents).toContain('{"type":"step_started","id":"bosh_product.deploying","description":"Installing BOSH"}')
            expect(parsed[0].contents).toContain('===== 2019-08-14 15:31:29 UTC Running "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"')
            expect(parsed[0].statusCode).toBe("2")
            expect(parsed[0].contents).toContain('Succeeded')
            expect(parsed[0].contents).toContain('===== 2019-08-14 15:32:21 UTC Finished "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"; Duration: 52s; Exit Status: 2')
            expect(parsed[0].contents).toContain('{"type":"step_finished","id":"bosh_product.deploying","description":"Installing BOSH"}')
        })
    })

    describe("handles json only marker opsman log section", () => {
        let rawLogData
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/opsman_json_only_markers.log')
        })

        it("returns a single opsman section", () => {
            let parsed = presenter.parseLogData(rawLogData)
            expect(parsed.length).toBe(1)
            expect(parsed[0].name).toBe("Installing BOSH")
            expect(parsed[0].statusCode).toBe("0")
            expect(parsed[0].contents).toContain('{"type":"step_started","id":"bosh_product.deploying","description":"Installing BOSH"}')
            expect(parsed[0].contents).toContain('Succeeded')
            expect(parsed[0].contents).toContain('{"type":"step_finished","id":"bosh_product.deploying","description":"Installing BOSH"}')
        })
    })

    describe("handles equals only marker opsman log section", () => {
        let rawLogData
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/opsman_equals_only_markers.log')
        })

        it("returns a single opsman section", () => {
            let parsed = presenter.parseLogData(rawLogData)
            expect(parsed.length).toBe(1)
            expect(parsed[0].name).toBe("/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml")
            expect(parsed[0].statusCode).toBe("0")
            expect(parsed[0].contents).toContain('===== 2019-08-14 15:31:29 UTC Running "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"')
            expect(parsed[0].contents).toContain('Succeeded')
            expect(parsed[0].contents).toContain('===== 2019-08-14 15:32:21 UTC Finished "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"; Duration: 52s; Exit Status: 0')
        })
    })

    describe("when there are opsmanager log sections", () => {
        let rawLogData
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/opsman_sections.log')
        })

        it("returns sections for the ops manager logs", () => {
            let parsed = presenter.parseLogData(rawLogData)
            expect(parsed.length).toBe(4)
            expect(parsed[0].contents).toBe("this comes before any sections\n\n")
            expect(parsed[1].name).toBe("first section (no opsman)")
            expect(parsed[2].name).toBe("second section (with opsman)")
            expect(parsed[2].contents.length).toBe(4)
            expect(parsed[2].contents[0].contents).toBe("log data before ops man call\n\n")
            expect(parsed[2].contents[1].name).toBe("Installing BOSH")
            expect(parsed[2].contents[1].statusCode).toBe("1")
            expect(parsed[2].contents[1].contents).toContain("Deployment manifest: '/var/tempest/workspaces/default/deployments/bosh.yml'")
            expect(parsed[2].contents[2].name).toBe("Uploading runtime config releases to the director")
            expect(parsed[2].contents[2].contents).toContain("Extracting release: Extracting release")
            expect(parsed[2].contents[3].contents).toBe("\nlog data after ops man call\n")
        })
    })
});

describe("renderLogData", () => {
    describe("renders a single chunk of text", () => {
        let sections = []
        beforeEach(() => {
            sections.push({
                contents: "some log data"
            })
        })
        it("returns just log text", () => {
            let rendered = presenter.renderLogData(sections)
            expect(rendered.log).toBe("some log data")
        })
    })
    describe("renders a section", () => {
        let sections = []
        beforeEach(() => {
            sections.push({
                name: "section",
                startMrl: '{"name":"section}',
                contents: "some log data",
                statusCode: "0",
                endMrl: '{"name":"section"}'
            })
        })
        it("returns a single details tag", () => {
            let rendered = presenter.renderLogData(sections)
            expect(rendered.log).toBe("<details><summary>section [success]</summary><strong>Begin section section</strong><br>some log data<strong>End section section</strong><br></details>")
        })
    })
    describe("renders nested sections", () => {
        let sections = []
        beforeEach(() => {
            sections.push({
                name: "outer",
                startMrl: '{"name":"outer}',
                contents: {
                    name: "inner",
                    startMrl: '{"name":"inner"}',
                    contents: "inner log data",
                    statusCode: "1",
                    endMrl: '{"name":"inner"}'
                },
                statusCode: "0",
                endMrl: '{"name":"outer"}'
            })
        })
        it("returns nested details tags", () => {
            let rendered = presenter.renderLogData(sections)
            expect(rendered.log).toBe('<details><summary>outer [success]</summary><strong>Begin section outer</strong><br><details id="inner"><summary>inner [failed]</summary><strong>Begin section inner</strong><br>inner log data<strong id="inner_end">End section inner</strong><br></details><strong>End section outer</strong><br></details>')
            expect(rendered.errors.length).not.toBe(0)
        })
    })
    describe("renders errors", () => {
        let sections = []
        beforeEach(() => {
            sections.push({
                name: "errors",
                startMrl: '{"name":"errors"}',
                contents: "an error",
                statusCode: "1",
                endMrl:'{"name":"errors"}'
            })
        })
        it("returns error header and contents", () => {
            let rendered = presenter.renderLogData(sections)
            expect(rendered.log).toBe('<details id="errors"><summary>errors [failed]</summary><strong>Begin section errors</strong><br>an error<strong id="errors_end">End section errors</strong><br></details>')
            expect(rendered.errors).toBe('<a href="#errors_end" onclick=\'presenter.openError("errors");\'>errors</a><br>')
        })
    })

    describe("renders errors", () => {
        let sections = []
        beforeEach(() => {
            sections.push({
                name: "some errors",
                startMrl: '{"name":"some errors"}',
                contents: "an error",
                statusCode: "1",
                endMrl: '{"name":"some errors"}'
            })
        })
        it("handles names with spaces (properly generates anchor names)", () => {
            sections[0].name = "some errors"
            let rendered = presenter.renderLogData(sections)
            expect(rendered.log).toBe('<details id="some_errors"><summary>some errors [failed]</summary><strong>Begin section some errors</strong><br>an error<strong id="some_errors_end">End section some errors</strong><br></details>')
            expect(rendered.errors).toBe('<a href="#some_errors_end" onclick=\'presenter.openError("some_errors");\'>some errors</a><br>')
        })
    })
})