This projects holds the contents for Elixir website hosted at elixir-lang.org.

It is automatically transformed by [Jekyll](https://github.com/mojombo/jekyll) into a static site.

## Contributing

#### 1. Fork and clone this repository

[Fork this
repository](https://github.com/elixir-lang/elixir-lang.github.com/fork) and
clone your fork. If you don't know what forking means or don't know how to do
it, nice instructions are available
[here](https://help.github.com/articles/fork-a-repo/).

#### 2. Install Ruby

This website is compiled into a static website using
[Jekyll](http://jekyllrb.com), a static-site generator written in Ruby. To
install Ruby you can follow [this
guide](https://www.ruby-lang.org/en/documentation/installation/). To check that
Ruby is installed correctly, run `ruby --version` in your shell; it should be
`1.9.3` or later.

#### 3. Install Bundler to manage dependencies

[Bundler](http://bundler.io) handles Ruby dependencies. To install it, simply
run:

```bash
$ gem install bundler
```

Once you have installed it, `cd` into the local clone of your fork and run:

```bash
$ bundle install
```

to download and install the necessary dependencies.

#### 4. Run Jekyll

In order to run a development server (with live-reloading on) just run:

```bash
$ bundle exec jekyll serve
```

The generated site will be available at [http://localhost:4000](http://localhost:4000). You can stop the
server with <kbd>Ctrl</kbd>-<kbd>C</kbd>.

#### 5. Make your changes and push them

Now you're ready to make your changes! Be sure to test the changes locally using
the development server. Once you're done with your changes, push those changes
to your fork and then [submit a **pull
request**](https://help.github.com/articles/using-pull-requests/). For a nice
wrap-up on how to open a good pull request have a look at the [Elixir
contributing
guide](https://github.com/elixir-lang/elixir/#contributing).

## License

* "Elixir" and the Elixir logo are copyrighted to [Plataformatec](http://plataformatec.com.br/). You may not reuse anything therein without permission.

* The HTML and CSS are copyrighted to [AlienWp](http://alienwp.com/) under [GPL license, version 2](http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

* The Social Icons are copyrighted to [Xeloader](http://xeloader.deviantart.com/art/Socialis-2-Freebie-213292616).

* The written textual contents available in the guides and blog are licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

* The available docs are licensed under the same license as their projects.
