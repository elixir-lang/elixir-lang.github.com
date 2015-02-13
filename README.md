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

First of all, [fork this
repository](https://github.com/elixir-lang/elixir-lang.github.com/fork).

To setup a development enviroment locally, you need to have Ruby installed; you
can follow [this guide](https://www.ruby-lang.org/en/documentation/installation/) to install it.
Once you have Ruby installed, `cd` into the forked project and run

```bash
$ bundle install
```

in order to download and install all the necessary dependencies and

```bash
$ bundle exec jekyll serve
```

to run a development server (with live-reloading on) on port 4000.

Now you're ready to make your changes! Be sure to test the changes locally using
the development server. Once you're done with your changes, push those changes
to your fork and then submit a **pull request**.

#### JavaScript processor

Jekyll (the static-site generator you installed before) requires a JavaScript
processor to be available. Many operating systems provide such functionality but
some don't. If you encounter errors related to "ExecJS", you can work around
them by either installing the `therubyracer` gem (`$ gem install therubyracer`)
or by ensuring [Node.js](http://nodejs.org) is in your `$PATH`.

### License

* "Elixir" and the Elixir logo are copyrighted to [Plataformatec](http://plataformatec.com.br/). You may not reuse anything therein without permission.

* The HTML and CSS are copyrighted to [AlienWp](http://alienwp.com/) under [GPL license, version 2](http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

* The Social Icons are copyrighted to [Xeloader](http://xeloader.deviantart.com/art/Socialis-2-Freebie-213292616).

* The written textual contents available in the guides and blog are licensed under Apache 2.0.

* The available docs are licensed under the same license as their projects.
