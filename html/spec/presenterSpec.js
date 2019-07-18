document = {
    getElementById: (elementId) => {}
}

describe("the presenter", () => {
    let logDataElement = {}
    let displayElement = {
        get innerHTML() {},
        set innerHTML(v) {},
    }

    let getElementById
    let displayInnerHTML

    beforeEach(() => {
        displayInnerHTML = spyOnProperty(displayElement, "innerHTML", "set")
        getElementById = spyOn(document, 'getElementById').and.returnValues(logDataElement, displayElement)
    })

    it("populates the display with the log data", () => {
        logDataElement.innerHTML = "this is my log"

        require("../presenter.js")
        expect(getElementById).toHaveBeenCalledWith("logData")
        expect(getElementById).toHaveBeenCalledWith("display")
        expect(displayInnerHTML).toHaveBeenCalledWith("this is my log")
    })
})