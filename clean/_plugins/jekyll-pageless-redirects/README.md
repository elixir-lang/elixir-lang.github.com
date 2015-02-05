# Jekyll Pageless Redirects
Redirect any number of pages with one file. Supports htaccess style redirects.

**Note**: "Pageless" indicates you don't need to create new `_pages` or `_posts` to make the redirects occur. Pages are still generated and follow the tried and true `http-equiv="refresh"` method of redirection. _This means the plugin **will** work on Github pages (if you generate your site and push it to `gh-pages`) or anywhere else that doesn't read .htaccess files._

## Usage
Install `pageless_redirects.rb` in your plugins directory (`_plugins` in vanilla Jekyll, `plugins` in Octopress).

To generate redirects create `_redirects.yml`, `_redirects.htaccess`, and/or `_redirects.json` in the Jekyll root directory. All follow the pattern `alias`, `final destination`.

### Sample `_redirects.yml`

	initial-page   : /destination-page
	other-page     : http://example.org/destination-page
	"another/page" : /destination-page

#### Result

* Requests to `/initial-page` are redirected to `/destination-page`
* Requests to `/other-page` are redirected to `http://example.org/destination-page`
* Requests to `/another/page` are redirected to `/destination-page`

### Sample `_redirects.htaccess`

	Redirect /some-page /destination-page
	Redirect 301 /different-page /destination-page
	Redirect cool-page http://example.org/destination-page

#### Result

* Requests to `/some-page` are redirected to `/destination-page`
* Requests to `/different-page` are redirected to `/destination-page`
* Requests to `/cool-page` are redirected to `http://example.org/destination-page`

### Sample `_redirects.json`

	{
		"some-page"        : "/destination-page",
		"yet-another-page" : "http://example.org/destination-page",
		"ninth-page"       : "/destination-page"
	}

#### Result

* Requests to `/some-page` are redirected to `/destination-page`
* Requests to `/yet-another-page` are redirected to `http://example.org/destination-page`
* Requests to `/ninth-page` are redirected to `/destination-page`

## Credit
This plugin borrows _heavily_ from [Jekyll Alias Generator](https://github.com/tsmango/jekyll_alias_generator) by [Thomas Mango](http://thomasmango.com)

## License
The MIT License (MIT)

Copyright (c) 2013 Nicholas Quinlan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
