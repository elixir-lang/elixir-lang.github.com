## Contents for Elixir website hosted at elixir-lang.org

It is automatically transformed by [Jekyll](http://github.com/mojombo/jekyll) into a static site.

## Development

Development is done in the `next` branch, while `master` contains the docs and guides for the latest stable release.

## Contributing with the blog

  Create a new file inside `_posts/YYYY-MM-DD-post-title.markdown` following the template:

    ---
    layout: post
    title:
    author:
    category:
    excerpt:
    ---

    Body text goes here...

  Or use `_bin/newpost` to bootstrap a new post file:

    export EDITOR=vim; _bin/newpost 'Post title'

## Contributing improvements or bug fixes

1. Fork elixir-lang.github.com

2. Make your changes

3. Test it locally

   You need to install `jekyll` and `rdiscount`

   ```shell
   $ gem install jekyll rdiscount
   $ jekyll serve # check localhost:4000
   ```

4. Send a pull-request for your changes.

## License

* The Elixir logo and website contents are copyrighted to [Plataformatec](http://plataformatec.com.br/).
You may not reuse anything therein without permission.

* The HTML and CSS are copyrighted to [AlienWp](http://alienwp.com/) under [GPL license, version 2](http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

* The Social Icons are copyrighted to [Xeloader](http://xeloader.deviantart.com/art/Socialis-2-Freebie-213292616).
