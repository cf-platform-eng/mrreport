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
        expect(displayInnerHTML).toHaveBeenCalledWith("this is my log");
    });
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
            //console.log(inspect(parsed, { depth: 10 }));
            expect(parsed.length).toBe(6);
        });
    });

    describe("when there are nested sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/nested_markers.log');
        });

        it("returns nested arrays of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            //console.log(inspect(parsed, {depth: 10}));
            expect(parsed.length).toBe(4);
            expect(parsed[0].contents).toContain("UUDDLRLRBA0");
        });

        it("returns twice nested arrays of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            //console.log(inspect(parsed, {depth: 10}));
            expect(parsed.length).toBe(4);
            expect(parsed[1].contents.length).toBe(5);
            expect(parsed[1].contents[1].contents[0].contents).toContain("UUDDLRLRBA1");
        });

        it("returns strings between objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            //console.log(inspect(parsed, {depth: 10}));
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
});