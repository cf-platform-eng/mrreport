const presenter = {
    injectElements: () => {
        const logData = document.getElementById('logData').innerHTML
        const display = document.getElementById('display')
        display.innerHTML = logData;
    },

    parseLogData: (input) => {
        let regex = /section-start: '(.+)' MRL:({.+})((.|\n)*)section-end: '(\1)' result: (\d+) MRL:({.+})/gm;
        let sections = [];
        let m;

        while ((m = regex.exec(input)) !== null) {
            let contents = m[3];
            let section = {
                name: m[1],
                startMrl: m[2],
                contents,
                statusCode: m[6],
                endMrl: m[7],
                sections: presenter.parseLogData(contents)
            };
            sections.push(section);
        }

        return sections;
    }
};

module.exports = presenter;