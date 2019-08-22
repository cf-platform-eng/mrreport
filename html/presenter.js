const presenter = {
    injectElements: () => {
        const logData = document.getElementById('logData').innerHTML
        const display = document.getElementById('display')
        const logContents = presenter.renderLogData(presenter.parseLogData(presenter.decode(logData)));

        if (logContents.errors.length > 0) {
            display.innerHTML = `<div><h1>Failures</h1>${logContents.errors}</div><div><h1>Log</h1>${logContents.log}</div>`
        } else {
            display.innerHTML = `<div><h1>Log</h1>${logContents.log}</div>`
        }
        
    },

    decode: function (str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    },

    replaceSpacesWithUnderscores: function (str) {
        return str.replace(' ', '_')
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
                    statusCode: m[41],
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
        let rendered = { log: '', errors: '' }
        if (section.name && section.name !== '') {
            const childRender = presenter.renderLogData(section.contents)
            if (section.statusCode && section.statusCode !== '0') {
                const anchorName = presenter.replaceSpacesWithUnderscores(section.name)
                rendered.log = `<details id="${anchorName}"><summary>${section.name} [failed]</summary><strong>Begin section ${section.name}</strong><br>${childRender.log}<strong>End section ${section.name}</strong><br></details>`;
                rendered.errors = childRender.errors + `<a href="#${anchorName}" onclick='presenter.openError("${anchorName}"); return false;'>${section.name}</a><br>`;
            } else {
                rendered.log = `<details><summary>${section.name} [success]</summary><strong>Begin section ${section.name}</strong><br>${childRender.log}<strong>End section ${section.name}</strong><br></details>`;
                rendered.errors = childRender.errors;
            }
            
        } else if (section.contents) {
            rendered = presenter.renderLogData(section.contents);
        } else if (section) {
            rendered.log = section;
        }
        return rendered
    },

    renderLogData: (input) => {
        let rendered = {log:'', errors:''}
        if (Array.isArray(input)) {
            input.forEach((section) => {
                newSection = presenter.renderSection(section);
                rendered.log += newSection.log;
                rendered.errors += newSection.errors
            })
        } else {
            rendered = presenter.renderSection(input);
        }
        return rendered;
    },

    openError: (id) => {
        document.getElementById(id).open = true;
    }
};

module.exports = presenter;