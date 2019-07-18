const fs = require("fs");
const { promisify } = require("util");
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
    describe("when there are sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/flat_markers.log');
        });

        it("splits based on tags into array of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(3);
        });
    });

    describe("when there are nested sections", () => {
        let rawLogData;
        beforeEach(async () => {
            rawLogData = await readFile('./spec/support/fixtures/nested_markers.log');
        });

        it("returns nested arrays of objects", () => {
            let parsed = presenter.parseLogData(rawLogData);
            expect(parsed.length).toBe(2);
            expect(parsed[0].sections.length).toBe(1);
        });
    });
});