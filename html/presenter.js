const presenter = {
    injectElements: () => {
        const logData = document.getElementById('logData').innerHTML
        const display = document.getElementById('display')
        display.innerHTML = presenter.renderLogData(presenter.parseLogData(presenter.decode(logData)));
    },

    decode: function (str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    },

    parseLogData: (input) => {
        let regex = /section-start: '(.+)' MRL:({.+}\n)((.|\n)*)section-end: '(\1)' result: (\d+) MRL:({.+}\n)|(.*\n?)/gm;
        let sections = [];
        let m;

        let text = '';
        while ((m = regex.exec(input)) !== null && m[0] !== '') {
            let contents = [];
            let section;
            if (m.length > 7 && m[8]) {
                text += m[8];   
            } else {
                if (text !== '') {
                    sections.push({
                        contents: text,
                    })                    
                    text = '';
                }
                sections.push({
                    name: m[1],
                    startMrl: m[2],
                    contents: presenter.parseLogData(m[3]),
                    statusCode: m[6],
                    endMrl: m[7],
                })
            }
        }

        if (text !== '') {
            sections.push({
                contents: text,
            })                    
        }

        return sections;
    },

    renderSection: (section) => {
        renderedSection = ''
        if (section.name && section.name !== '') {
            let resultString = (section.statusCode && section.statusCode !== '0') ? 'failed' : 'success'
            renderedSection += `<details><summary>${section.name} [${resultString}]</summary><strong>Begin section ${section.name}</strong><br>${presenter.renderLogData(section.contents)}<strong>End section ${section.name}</strong><br></details>`
        } else if (section.contents) {
            renderedSection += presenter.renderLogData(section.contents)
        } else if (section) {
            renderedSection += section
        }
        return renderedSection
    },

    renderLogData: (input) => {
        let rendered = ''
        if (Array.isArray(input)) {
            input.forEach((section) => {
                rendered += presenter.renderSection(section)
            })
        } else {
            rendered += presenter.renderSection(input)
        }
        return rendered
    }
};

module.exports = presenter;