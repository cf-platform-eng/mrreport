const presenter = {
    injectElements: () => {
        const logData = document.getElementById('logData').innerHTML
        const display = document.getElementById('display')
        display.innerHTML = logData;
    },

    parseLogData: (input) => {
        let regex = /section-start: '(.+)' MRL:({.+})((.|\n)*)section-end: '(\1)' result: (\d+) MRL:({.+})/gm;
        let matches = [];
        let m;

        while ((m = regex.exec(input)) !== null) {
            var name = m[1];
            var startMrl = m[2];
            var contents = m[3];
            var statusCode = m[6];
            var endMrl = m[7];
            var sections = presenter.parseLogData(contents);
        
            matches.push({ name, startMrl, contents, sections, statusCode, endMrl });
        }

        return matches;
    }
};

module.exports = presenter;