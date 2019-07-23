const presenter = {
    injectElements: () => {
        const logData = document.getElementById('logData').innerHTML
        const display = document.getElementById('display')
        display.innerHTML = logData;
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
                text += m[8].trim() + '\n';   
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
    }
};

module.exports = presenter;