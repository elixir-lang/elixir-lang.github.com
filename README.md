# elixir-lang.org 日本語サイト elixir-lang.jp リポジトリ

## 翻訳の仕方

### 環境

- Ruby
- bundler gem

### 手順

1. `git clone https://github.com/elixir-lang-jp/elixir-lang.github.com.git`
1. `cd elixir-lang.github.com`
1. `bundle`
1. `bundle exec rake`
1. `_po/ja/` 配下にある `*edit.po` ファイル内で任意の箇所を翻訳する
    - 翻訳の仕方は `_po/ja/index.po` などを参考にしてください
    - `msgid` の部分を、直後の `msgstr` で翻訳します
    - 日本語化で使用しているGemは https://github.com/ruby-gettext/jekyll-task-i18n です
1. `./build_ja_pages.sh` を実行して、GitHub Page用の日本語サイトを生成する
1. プルリクエストを `elixir-lang-jp` の `master` ブランチ向けに作る

### ローカルでの確認方法

1. `bundle exec jekyll serve`
1. `http://localhost:4000/ja` で確認できます
    - GitHub Pageではルート直下でホスティングされるので、リンク周りはうまく動作しません
        - 手でURLを直打ちして確認してください
        - `http://localhost:4000/ja/install` など

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
