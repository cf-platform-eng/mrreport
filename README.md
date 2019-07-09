# (M)achine (R)eadable (Reporter)

Generates a web report from the log outputs of our test-cases

## Requirements

* GO 1.12
* chromedriver 
  * MacOS: `brew install chromedriver`

## Usage

mrreport takes log data from stdin, generates an HTML report, and outputs in on stdout.

```bash
cat logfile.log | mrreport generate > report.html
```
