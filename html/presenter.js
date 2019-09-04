const presenter = {
    injectElements: () => {
        const logData = document.getElementById('logData').innerHTML
        const display = document.getElementById('display')
        const logContents = presenter.renderLogData(presenter.parseLogData(presenter.decode(logData)));

        let html = '';
        if (logContents.errors.length > 0) {
            html += `<div><h1>Failures</h1>${logContents.errors}</div>`;
        }
        if (logContents.configuration.length > 0) {
            html += `<div><h1>Configuration</h1>${logContents.configuration}</div>`;
        }
        html += `<div><h1>Log</h1>${logContents.log}</div>`;  
        
        display.innerHTML = html;
    },

    decode: function (str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    },

    replaceSpacesWithUnderscores: function (str) {
        return str.replace(' ', '_')
    },

    isDependencyLine: function (str) {
        return /^dependency:.*MRL:{.*}$/gm.test(str)
    },

    parseOpsManSection: (input) => {
        // TODO: find way to compose these to make the regex easier to grok
        //let twoLineSection = '({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) Duration: (.+); Exit Status: (.+)\n)({"type":"(.+)","id":"(\3)","description":"(.+)"}\n?)'
        //let jsonSection = '({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)((.|\n)*)({"type":"(.+)","id":"(\22)","description":"(.+)"}\n)'
        //let equalsSection = '(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) "(\33)"; Duration: (.+); Exit Status: (.+)\n*)'
        //let textLine = '(.*\n?)'
        //let regex = new RegExp('/' + twoLineSection + '|' + jsonSection + '|' + textLine + '/', "gm")
        
        let regex = /({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) Duration: (.+); Exit Status: (.+)\n)({"type":"(.+)","id":"(\3)","description":"(.+)"}\n?)|({"type":"(.+)","id":"(.+)","description":"(.+)"}\n)((.|\n)*)({"type":"(.+)","id":"(\22)","description":"(.+)"}\n)|(===== (.+) UTC (.+) "(.+)"\n)((.|\n)*)(===== (.+) UTC (.+) "(\33)"; Duration: (.+); Exit Status: (.+)\n*)|(.*\n?)/gm;
        let dependencies = [];
        let sections = [];
        let text = '';
        let m;
        while ((m = regex.exec(input)) !== null && m[0] !== '') {
            // Build lines of text before a section (the final regex group)
            if (m.length > 41 && m[42]) {
                text += m[42];
                if (presenter.isDependencyLine(m[42])) {
                    dependencies.push(m[42])
                }
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

        return { sections, dependencies };
    },

    parseLogData: (input) => {
        let regex = /section-start: '(.+)' MRL:({.+}\n)((.|\n)*)section-end: '(\1)' result: (\d+) MRL:({.+}\n)|(.*\n?)/gm;
        let sections = [];
        let dependencies = [];
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
                const subSection = presenter.parseOpsManSection(text)
                sections = sections.concat(subSection.sections);
                dependencies = dependencies.concat(subSection.dependencies);
                text = '';
            }

            const subSection = presenter.parseLogData(m[3]);
            dependencies = dependencies.concat(subSection.dependencies);

            // Add the matched section
            sections.push({
                name: m[1],
                startMrl: m[2],
                contents: subSection.sections,
                statusCode: m[6],
                endMrl: m[7],
            })
        }

        // Add a section for any trailing text
        if (text !== '') {
            const subSection = presenter.parseOpsManSection(text)
            sections = sections.concat(subSection.sections);
            dependencies = dependencies.concat(subSection.dependencies);
        }

        return { sections, dependencies };
    },

    renderSection: (section) => {
        let rendered = { log: '', errors: '', configuration: '' }
        if (section.name && section.name !== '') {
            const childRender = presenter.renderSections(section.contents)
            if (section.statusCode && section.statusCode !== '0') {
                const anchorName = presenter.replaceSpacesWithUnderscores(section.name)
                rendered.log = `<details id="${anchorName}"><summary>${section.name} [failed]</summary><strong>Begin section ${section.name}</strong><br>${childRender.log}<strong id="${anchorName}_end">End section ${section.name}</strong><br></details>`;
                rendered.errors = childRender.errors + `<a href="#${anchorName}_end" onclick='presenter.openError("${anchorName}");'>${section.name}</a><br>`;
                rendered.configuration = childRender.configuration;
            } else {
                rendered.log = `<details><summary>${section.name} [success]</summary><strong>Begin section ${section.name}</strong><br>${childRender.log}<strong>End section ${section.name}</strong><br></details>`;
                rendered.errors = childRender.errors;
                rendered.configuration = childRender.configuration;
            }

            if (section.name === 'actual configuration') {
                rendered.configuration += rendered.log;
            }
            
        } else if (section.contents) {
            rendered = presenter.renderSections(section.contents);
        } else if (section) {
            rendered.log = section;
        }
        return rendered
    },

    renderSections: (sections) => {
        let rendered = { log: '', errors: '', configuration: '' }
        if (Array.isArray(sections)) {
            sections.forEach((section) => {
                newSection = presenter.renderSection(section);
                rendered.log += newSection.log;
                rendered.errors += newSection.errors;
                rendered.configuration += newSection.configuration;
            })
        } else {
            rendered = presenter.renderSection(sections);
        }
        return rendered;
    },

    renderLogData: (parsed) => {
        let rendered = presenter.renderSections(parsed.sections);
        if (parsed.dependencies.length > 0) {
            dependencies = parsed.dependencies.reduce((accum, dependency) => {
                return accum + dependency;
            })
            rendered.dependencies = `<details><summary>dependencies</summary>${dependencies}</details>`
        }
        return rendered;
    },

    openError: (id) => {
        element = document.getElementById(id)
        while (element) {
            if (element.nodeName.toLowerCase() === 'details') {
                element.open = true;
            }
            element = element.parentNode;
        }
    }
};

module.exports = presenter;