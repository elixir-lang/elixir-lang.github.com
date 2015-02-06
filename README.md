### Contents for Elixir website hosted at elixir-lang.org

It is automatically transformed by [Jekyll](http://github.com/mojombo/jekyll) into a static site.

### Contributing to the blog

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

```bash
export EDITOR=vim; _bin/newpost 'Post title'
```

### Contributing improvements or bug fixes

1. [Fork elixir-lang.github.com](https://github.com/elixir-lang/elixir-lang.github.com/fork).

2. Make your changes.

3. Test it locally, you need to install the gems `jekyll` and `redcarpet`:

```bash
$ gem install jekyll redcarpet
$ jekyll serve # check localhost:4000
```

4. Push to your forked repository.

5. Submit a pull-request for your changes.

`jekyll` requires a javascript processor to be available too. Many OS provide such functionality but others do not. If you have an error related to ExecJS, you can work around it by either running `gem install therubyracer` or by ensuring node.js is available in your path.

### License

* "Elixir" and the Elixir logo are copyrighted to [Plataformatec](http://plataformatec.com.br/). You may not reuse anything therein without permission.

* The HTML and CSS are copyrighted to [AlienWp](http://alienwp.com/) under [GPL license, version 2](http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

* The Social Icons are copyrighted to [Xeloader](http://xeloader.deviantart.com/art/Socialis-2-Freebie-213292616).

* The written textual contents available in the guides and blog are licensed under Apache 2.0.

* The available docs are licensed under the same license as their projects.
