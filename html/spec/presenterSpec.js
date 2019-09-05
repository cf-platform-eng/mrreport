const fs = require("fs");
const { promisify, inspect } = require("util");
const readFile = promisify(fs.readFile);
let presenter = require("../presenter.js");

document = {
    getElementById: (elementId) => {}
};

function sectionHTML(name, contents) {
    return `<div><h1>${name}</h1>${contents}</div>`
}

describe("injectElements", () => {
    let logDataElement = {};
    let displayElement = {
        get innerHTML() {
        },
        set innerHTML(v) {
        }
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
        expect(displayInnerHTML).toHaveBeenCalledWith(sectionHTML("Log", "this is my log"));
    });

    it("populates the display with decoded log data", () => {
        logDataElement.innerHTML = 'this &#34;is&#34; my log';
        presenter.injectElements();

        expect(getElementById).toHaveBeenCalledWith("logData");
        expect(getElementById).toHaveBeenCalledWith("display");
        expect(displayInnerHTML).toHaveBeenCalledWith(sectionHTML('Log', 'this "is" my log'));
    })

    describe("renders all sections properly", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/basic_render.log');
        })
        it("populates the display with error section, config section and log section", () => {
            logDataElement.innerHTML = rawLogData.toString();
            presenter.injectElements();
            expect(getElementById).toHaveBeenCalledWith("logData");
            expect(getElementById).toHaveBeenCalledWith("display");
            args = displayInnerHTML.calls.argsFor(0)[0];
            expect(args).toContain(sectionHTML('Failures', '<a href="#failure_end" onclick=\'presenter.openError("failure");\'>failure</a><br>'))
            expect(args).toContain('<div><h1>Configuration</h1><details><summary>actual configuration [success]</summary><strong>Begin section actual configuration</strong><br>config')
            expect(args).toContain('<strong>End section actual configuration</strong><br></details></div>')
            expect(args).toContain('<div><h1>Dependencies</h1><details><summary>dependencies</summary>dependency: \'dep\' version \'0.0.1\' MRL:{"type":"dependency","version":"0.0.1","name":"dep","time":"2019-08-16T21:19:34.523528521Z"}')
            expect(args).toContain('</details></div><div><h1>Log</h1><details id="failure"><summary>failure [failed]</summary><strong>Begin section failure</strong><br>dependency: \'dep\' version \'0.0.1\' MRL:{"type":"dependency","version":"0.0.1","name":"dep","time":"2019-08-16T21:19:34.523528521Z"}')
            expect(args).toContain('<details><summary>actual configuration [success]</summary><strong>Begin section actual configuration</strong><br>config')
            expect(args).toContain('<strong>End section actual configuration</strong><br></details>failure')
            expect(args).toContain('<strong id="failure_end">End section failure</strong><br></details></div>')
        })

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
            expect(parsed.sections.length).toBe(1);
            expect(parsed.sections[0].contents).toContain("Pulling amidos/dcind@sha256:fb793c416c7aebaf56dfb936d4f09124666d25eb53ac4bd573877fc06dd6b561...")
            expect(parsed.sections[0].contents).toContain("sha256:fb793c416c7aebaf56dfb936d4f09124666d25eb53ac4bd573877fc06dd6b561: Pulling from amidos/dcind")
        })
    })
    describe("when there are sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/flat_markers.log');
        });

        it("splits based on tags into array of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.sections.length).toBe(6);
            expect(parsed.sections[0].contents).toBe("UUDDLRLRBA0\n\n")
            expect(parsed.sections[1].name).toBe("pull")
            expect(parsed.sections[2].name).toBe("pull2")
            expect(parsed.sections[2].contents.length).toBe(1)
            expect(parsed.sections[2].contents[0].contents).toBe("UUDDLRLRBA1\n")
            expect(parsed.sections[3].contents).toBe("\n")
            expect(parsed.sections[4].name).toBe("pull3")
            expect(parsed.sections[4].contents.length).toBe(1)
            expect(parsed.sections[4].contents[0].contents).toBe("UUDDLRLRBA2\n")
        });
    });

    describe("when there are nested sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/nested_markers.log');
        });

        it("returns nested arrays of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.sections.length).toBe(4);
            expect(parsed.sections[0].contents).toContain("UUDDLRLRBA0\n");
            expect(parsed.sections[1].contents.length).toBe(5)
            expect(parsed.sections[1].name).toBe("pull")
            expect(parsed.sections[1].statusCode).toBe("0")
            expect(parsed.sections[2].name).toBe("pull2")
            expect(parsed.sections[2].statusCode).toBe("2")
            expect(parsed.sections[3].contents).toContain("apk add jq")
            expect(parsed.sections[3].contents).toContain("fetch http://dl-cdn.alpinelinux.org/alpine/v3.10/main/x86_64/APKINDEX.tar.gz")
        });

        it("returns twice nested arrays of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.sections.length).toBe(4);
            expect(parsed.sections[1].name).toBe("pull")
            const pull = parsed.sections[1]
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
            expect(parsed.sections.length).toBe(4);
            expect(parsed.sections[1].contents.length).toBe(5);
            expect(parsed.sections[1].contents[2].contents).toContain("hello from the middle");
        });
    });

    describe("when last line has no newline", () => {
        let rawLogData
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/no_final_newline.log')
        })
        it("returns last line when it doesn't finish with a newline", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.sections.length).toBe(1);
            expect(parsed.sections[0].contents).toContain("sha256:fb793c416c7aebaf56dfb936d4f09124666d25eb53ac4bd573877fc06dd6b561: Pulling from amidos/dcind")
        })
    })

    describe("handles opsman sections", () => {
        describe("handles double marker opsman log section", () => {
            let rawLogData
            beforeEach(async () => {
                rawLogData = await readFile('./spec/support/fixtures/an_opsman_section.log')
            })

            it("returns a single opsman section", () => {
                let parsed = presenter.parseLogData(rawLogData)
                expect(parsed.sections.length).toBe(1)
                expect(parsed.sections[0].name).toBe("Installing BOSH")
                expect(parsed.sections[0].contents).toContain('{"type":"step_started","id":"bosh_product.deploying","description":"Installing BOSH"}')
                expect(parsed.sections[0].contents).toContain('===== 2019-08-14 15:31:29 UTC Running "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"')
                expect(parsed.sections[0].statusCode).toBe("2")
                expect(parsed.sections[0].contents).toContain('Succeeded')
                expect(parsed.sections[0].contents).toContain('===== 2019-08-14 15:32:21 UTC Finished "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"; Duration: 52s; Exit Status: 2')
                expect(parsed.sections[0].contents).toContain('{"type":"step_finished","id":"bosh_product.deploying","description":"Installing BOSH"}')
            })
        })

        describe("handles json only marker opsman log section", () => {
            let rawLogData
            beforeEach(async () => {
                rawLogData = await readFile('./spec/support/fixtures/opsman_json_only_markers.log')
            })

            it("returns a single opsman section", () => {
                let parsed = presenter.parseLogData(rawLogData)
                expect(parsed.sections.length).toBe(1)
                expect(parsed.sections[0].name).toBe("Installing BOSH")
                expect(parsed.sections[0].statusCode).toBe("0")
                expect(parsed.sections[0].contents).toContain('{"type":"step_started","id":"bosh_product.deploying","description":"Installing BOSH"}')
                expect(parsed.sections[0].contents).toContain('Succeeded')
                expect(parsed.sections[0].contents).toContain('{"type":"step_finished","id":"bosh_product.deploying","description":"Installing BOSH"}')
            })
        })

        describe("handles equals only marker opsman log section", () => {
            let rawLogData
            beforeEach(async () => {
                rawLogData = await readFile('./spec/support/fixtures/opsman_equals_only_markers.log')
            })

            it("returns a single opsman section", () => {
                let parsed = presenter.parseLogData(rawLogData)
                expect(parsed.sections.length).toBe(1)
                expect(parsed.sections[0].name).toBe("/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml")
                expect(parsed.sections[0].statusCode).toBe("0")
                expect(parsed.sections[0].contents).toContain('===== 2019-08-14 15:31:29 UTC Running "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"')
                expect(parsed.sections[0].contents).toContain('Succeeded')
                expect(parsed.sections[0].contents).toContain('===== 2019-08-14 15:32:21 UTC Finished "/usr/local/bin/bosh --no-color --non-interactive --tty create-env /var/tempest/workspaces/default/deployments/bosh.yml"; Duration: 52s; Exit Status: 0')
            })
        })

        describe("when there are opsmanager log sections", () => {
            let rawLogData
            beforeEach(async () => {
                rawLogData = await readFile('./spec/support/fixtures/opsman_sections.log')
            })

            it("returns sections for the ops manager logs", () => {
                let parsed = presenter.parseLogData(rawLogData)
                expect(parsed.sections.length).toBe(4)
                expect(parsed.sections[0].contents).toBe("this comes before any sections\n\n")
                expect(parsed.sections[1].name).toBe("first section (no opsman)")
                expect(parsed.sections[2].name).toBe("second section (with opsman)")
                expect(parsed.sections[2].contents.length).toBe(4)
                expect(parsed.sections[2].contents[0].contents).toBe("log data before ops man call\n\n")
                expect(parsed.sections[2].contents[1].name).toBe("Installing BOSH")
                expect(parsed.sections[2].contents[1].statusCode).toBe("1")
                expect(parsed.sections[2].contents[1].contents).toContain("Deployment manifest: '/var/tempest/workspaces/default/deployments/bosh.yml'")
                expect(parsed.sections[2].contents[2].name).toBe("Uploading runtime config releases to the director")
                expect(parsed.sections[2].contents[2].contents).toContain("Extracting release: Extracting release")
                expect(parsed.sections[2].contents[3].contents).toBe("\nlog data after ops man call\n")
            })
        })
        describe("pulls out dependencies", () => {
            let rawLogData
            beforeEach(async () => {
                rawLogData = await readFile('./spec/support/fixtures/dependencies.log')
            })
            it("returns dependencies", () => {
                let parsed = presenter.parseLogData(rawLogData)
                expect(parsed.sections.length).toBe(1)
                expect(parsed.dependencies.length).toBe(3)
            })
        })
    })
});

function successDetailsHTML(name, contents) {
    return `<details><summary>${name} [success]</summary><strong>Begin section ${name}</strong><br>${contents}<strong>End section ${name}</strong><br></details>`;
}

function failedDetailsHTML(name, contents) {
    const id = name.replace(' ', '_');
    return `<details id="${id}"><summary>${name} [failed]</summary><strong>Begin section ${name}</strong><br>${contents}<strong id="${id}_end">End section ${name}</strong><br></details>`;
}

function errorsHTML(name) {
    const id = name.replace(' ', '_');
    return `<a href="#${id}_end" onclick=\'presenter.openError("${id}");\'>${name}</a><br>`;
}

function dependencyHTML(dependencies) {
    return `<details><summary>dependencies</summary>${dependencies}</details>`;
}

describe("renderLogData", () => {
    describe("renders a single chunk of text", () => {
        let parsed = { sections: [], dependencies: [] }
        beforeEach(() => {
            parsed.sections.push({
                contents: "some log data"
            })
        })
        it("returns just log text", () => {
            let rendered = presenter.renderLogData(parsed)
            expect(rendered.log).toBe("some log data")
        })
    })
    describe("renders a section", () => {
        let parsed = { sections: [], dependencies: [] }
        beforeEach(() => {
            parsed.sections.push({
                name: "section",
                startMrl: '{"name":"section}',
                contents: "some log data",
                statusCode: "0",
                endMrl: '{"name":"section"}'
            })
        })
        it("returns a single details tag", () => {
            let rendered = presenter.renderLogData(parsed)
            expect(rendered.log).toBe(successDetailsHTML('section', 'some log data'))
        })
    })
    describe("renders nested sections", () => {
        let parsed = { sections: [], dependencies: [] }
        beforeEach(() => {
            parsed.sections.push({
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
            let rendered = presenter.renderLogData(parsed)
            expect(rendered.log).toBe(successDetailsHTML('outer', failedDetailsHTML('inner', 'inner log data')));
            expect(rendered.errors.length).not.toBe(0)
        })
    })
    describe("renders errors", () => {
        let parsed = { sections: [], dependencies: [] }
        beforeEach(() => {
            parsed.sections.push({
                name: "errors",
                startMrl: '{"name":"errors"}',
                contents: "an error",
                statusCode: "1",
                endMrl:'{"name":"errors"}'
            })
        })
        it("returns error header and contents", () => {
            let rendered = presenter.renderLogData(parsed)
            expect(rendered.log).toBe(failedDetailsHTML('errors', 'an error'));
            expect(rendered.errors).toBe(errorsHTML('errors'));
        })
    })

    describe("renders errors when names have spaces", () => {
        let parsed = { sections: [], dependencies: [] }
        beforeEach(() => {
            parsed.sections.push({
                name: "some errors",
                startMrl: '{"name":"some errors"}',
                contents: "an error",
                statusCode: "1",
                endMrl: '{"name":"some errors"}'
            })
        })
        it("handles names with spaces (properly generates anchor names)", () => {
            let rendered = presenter.renderLogData(parsed)
            expect(rendered.log).toBe(failedDetailsHTML('some errors', 'an error'));
            expect(rendered.errors).toBe(errorsHTML('some errors'));
        })
    })
    describe("renders configuration section", () => {
        let parsed = { sections: [], dependencies: [] }
        beforeEach(() => {
            parsed.sections.push({
                name: "actual configuration",
                startMrl: '{"name":"actual configuration"}',
                contents: "some configuration",
                statusCode: "0",
                endMrl: '{"name":"actual configuration"}'
            })
        })
        it("pulls configuration section out", () => {
            let rendered = presenter.renderLogData(parsed)
            expect(rendered.log).toBe(successDetailsHTML('actual configuration', 'some configuration'));
            expect(rendered.configuration).toBe(successDetailsHTML('actual configuration', 'some configuration'));
        })
    })
    describe("renders dependency section", () => {
        let parsed = { sections: [], dependencies: [] }
        beforeEach(() => {
            parsed.dependencies.push("a dependency")
        })
        it("renders dependency section", () => {
            let rendered = presenter.renderLogData(parsed)
            expect(rendered.log).toBe('')
            expect(rendered.configuration).toBe('')
            expect(rendered.dependencies).toBe(dependencyHTML('a dependency'));
        })
    })
})