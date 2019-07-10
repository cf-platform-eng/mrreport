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

## Testing

When you're testing, `packr` will use the generated content if it exists, not the content of `html/index.html`.

* `make units` will avoid using packr
* `make features` will regenerate using `packr2` and use the generated files

When working with other test-runners (e.g. goland's), make sure you either
  * run them with the `skippackr`
  * add a before-run step that does `packr2 build`
  