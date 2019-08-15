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

    parseOpsManSection: (input) => {
        // TODO: find way to compose these to make the regex easier to grok
        //let twoLineSection = '({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) Duration: (.+); Exit Status: (.+)\n)({"type":"(.+)","id":"(\3)","description":"(.+)"}\n?)'
        //let jsonSection = '({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)((.|\n)*)({"type":"(.+)","id":"(\22)","description":"(.+)"}\n)'
        //let equalsSection = '(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) "(\33)"; Duration: (.+); Exit Status: (.+)\n*)'
        //let textLine = '(.*\n?)'
        //let regex = new RegExp('/' + twoLineSection + '|' + jsonSection + '|' + textLine + '/', "gm")
        
        let regex = /({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) Duration: (.+); Exit Status: (.+)\n)({"type":"(.+)","id":"(\3)","description":"(.+)"}\n?)|({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)((.|\n)*)({"type":"(.+)","id":"(\22)","description":"(.+)"}\n)|(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) "(\33)"; Duration: (.+); Exit Status: (.+)\n*)|(.*\n?)/gm;
        let sections = [];
        let text = '';
        let m;
        while ((m = regex.exec(input)) !== null && m[0] !== '') {
            // Build lines of text before a section (the final regex group)
            if (m.length > 41 && m[42]) {
                text += m[42];
                continue
            }

            // Add a section for text before making a new section
            if (text !== '') {
                sections.push({
                    contents: text,
                })
                text = '';
            }

            // handle json only (the second regex group)
            if (m.length > 19 && m[20]) {
                sections.push({
                    name: m[23],
                    contents: m[20] + m[24] + m[26],
                    statusCode: "0",
                })                
                continue;
            }
            
            // handle equals delimited section (the third regex group)
            if (m.length > 29 && m[30]) {
                sections.push({
                    name: m[33],
                    contents: m[30] + m[34] + m[36],
                    statusCode: m[40],
                })
                continue;
            }
            // handle full two line section marker (the first regex group)
            sections.push({
                name: m[4],
                contents: m[1] + m[5] + m[9] + m[11] + m[16],
                statusCode: m[15],
            })
        }

        // Add a section for any trailing text
        if (text !== '') {
            sections.push({
                contents: text,
            })
        }

        return sections;
    },

    parseLogData: (input) => {
        let regex = /section-start: '(.+)' MRL:({.+}\n)((.|\n)*)section-end: '(\1)' result: (\d+) MRL:({.+}\n)|(.*\n?)/gm;
        let sections = [];
        let m;

        let text = '';
        while ((m = regex.exec(input)) !== null && m[0] !== '') {
            // Build lines of text before a section
            if (m.length > 7 && m[8]) {
                text += m[8];
                continue
            }

            // Add a section for text before making a new section
            if (text !== '') {
                sections = sections.concat(presenter.parseOpsManSection(text));
                text = '';
            }

            // Add the matched section
            sections.push({
                name: m[1],
                startMrl: m[2],
                contents: presenter.parseLogData(m[3]),
                statusCode: m[6],
                endMrl: m[7],
            })
        }

        // Add a section for any trailing text
        if (text !== '') {
            sections = sections.concat(presenter.parseOpsManSection(text));
        }

        return sections;
    },

    renderSection: (section) => {
        let renderedSection = ''
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