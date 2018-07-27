---
title: "Installing Elixir"
section: install
layout: default
---
{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}

# {{ page.title }}

{% include toc.html %}

目次の Distributions からご自分の環境を選んでください。簡単にインストールできます！それ以外には、パッケージをプリプロセス(プリコンパイル)してコンパイルする方法がありますので、そちらを利用してください。

Note > Elixir {{ stable.name }} の使用には Erlang {{ stable.minimum_otp }} 以降が必要ですが、大抵は自動でインストールされます。もしインストールされないようでしたら、"Installing Erlang" を参照してください。

## Distributions

お好きなオプションをお選びいただけます。あなたのシステムに Elixir をインストールしましょう！

以前に一度 Elixir/Erlang をインストールしたことがあるのでしたら、 "Compiling with version managers" や " Compiling form source (Unix and MinGW) " を参照してください。

### Mac OS X

  * Homebrew をお使いの場合
    * Homebrew を最新バージョンにアップデート: `brew update`
    * インストール: `brew install elixir`
  * Macports をお使いの場合
    * インストール: `sudo port install elixir`

### Unix (and Unix-like)

  * Arch Linux (Community repo) をお使いの場合
    * インストール: `pacman -S elixir`
  * openSUSE (and SLES 11 SP3+) をお使いの場合
    * Erlang devel リポジトリの追加: `zypper ar -f http://download.opensuse.org/repositories/devel:/languages:/erlang/openSUSE_Factory/ erlang`
    * インストール: `zypper in elixir`
  * Gentoo をお使いの場合
    * インストール: `emerge --ask dev-lang/elixir`
  * GNU Guix
    * インストール: `guix package -i elixir`
  * Fedora 21 (and older) をお使いの場合
    * インストール: `yum install elixir`
  * Fedora 22 (and newer)
    * インストール `dnf install elixir`
  * FreeBSD をお使いの場合
    * ports : `cd /usr/ports/lang/elixir && make install clean`
    * pkg: `pkg install elixir`
  * Solus をお使いの場合
    * インストール: `eopkg install elixir`
  * Ubuntu 14.04/16.04/16.10/17.04 or Debian 7/8/9
    * Erlang Solutions リポジトリの追加: `wget https://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb && sudo dpkg -i erlang-solutions_1.0_all.deb`
    * リストのアップデート: `sudo apt-get update`
    * Erlang/OTP プラットフォームとそれら全アプリケーションのインストール: `sudo apt-get install esl-erlang`
    * Elixir をインストール: `sudo apt-get install elixir`

### Windows

  * インストーラーの利用
    * [ダウンロード](https://repo.hex.pm/elixir-websetup.exe)
    * 画面に従って進んでいただくと完了です
  * Chocolatey
    * インストール: `cinst elixir`

### Raspberry Pi

以下は Stretch の場合ですが、必要であれば "stretch" の部分をあなたの Raspbian に置き換えてください。

  * armhf でパッケージをプリビルドしましょう。再コンパイルに比べると大幅に時間を短縮してくれます。
  * 公開鍵の取得
    * `echo "deb https://packages.erlang-solutions.com/debian stretch contrib" | sudo tee /etc/apt/sources.list.d/erlang-solutions.list`
    * Erlang のインストール: `wget https://packages.erlang-solutions.com/debian/erlang_solutions.asc`
    * 鍵を keychain に追加: `sudo apt-key add erlang_solutions.asc`
  * Elixir
    * apt のアップデート: `sudo apt update`
    * Elixir のインストール: `sudo apt install elixir`

### Docker

もしあなたが Docker に親しみ慣れているのなら、公式 Docker イメージを使えばとても簡単です。

  * Enter interactive mode
    * Run: `docker run -it --rm elixir`
  * Enter bash within container with installed `elixir`
    * Run: `docker run -it --rm elixir bash`

これらのディストリビューションは、たいてい自動で Erlang もインストールしてくれますが、もしインストールされない場合は [Installing Erlang](/install.html#installing-erlang) を参照してください.

プリコンパイル済みパッケージのリストが必要でしたら、こちらからどうぞ。[https://elixir-lang.org/elixir.csv](https://elixir-lang.org/elixir.csv).

## Precompiled package

Elixir はリリースごとにプリコンパイル済みパッケージをご用意しています。まずはじめに [Erlangをインストール](/install.html#installing-erlang) します。次に [最新の Precopiled.zip ファイル](https://github.com/elixir-lang/elixir/releases/download/v{{ stable.version }}/Precompiled.zip)をダウンロード後、解凍してください。.

一度ファイルを解凍すると 'bin' ディレクトリから 'elixir' や 'iex' コマンドを使用できますが、Elixir へのパスを環境変数 PATH に追加した方が効率的でしょう。
詳しくは [環境変数にパスを追加する](#setting-path-environment-variable) を参照してください。

## Compiling with version managers

それぞれバージョンの異なる Erlang や Elixir をインストールして、それらを管理できるようにするツールというのはいくつかあります。

  * [asdf](https://github.com/asdf-vm/asdf) - Erlang と Elixir の複数バージョンをインストールし管理ができます。
  * [exenv](https://github.com/mururu/exenv) - 〃
  * [kiex](https://github.com/taylor/kiex) - 〃
  * [kerl](https://github.com/yrashk/kerl) - 〃

手動でソースファイルからコンパイルをお望みでしたら、そちらの方法もご用意しています。

## Compiling from source (Unix and MinGW)

Elixir のダウンロードやコンパイルの前に、まず [Erlang をインストール](/install.html#installing-erlang) してください。

そうしましたら次は [最新バージョン](https://github.com/elixir-lang/elixir/releases/tag/v{{ stable.version }}) の Elixir のソースコード ([.zip](https://github.com/elixir-lang/elixir/archive/v{{ stable.version }}.zip), [.tar.gz](https://github.com/elixir-lang/elixir/archive/v{{ stable.version }}.tar.gz)) をダウンロードしましょう。ファイルを解凍してディレクトリに移動し、 `make` コマンドを実行します。(note: Windows をお使いの方は [Windows 環境に Elixir をコンパイルする方法](https://github.com/elixir-lang/elixir/wiki/Windows))を参照してください。)

コンパイルが完了すると `bin` ディレクトリから `iex` コマンドで Elixir の REPL を起動できます。手軽な開発の為にも [Elixir を環境変数 PATH に追加](#setting-path-environment-variable) することをおすすめします。

好奇心旺盛な方なら master ブランチから開発途中の Elixir もコンパイルしてお試しいただけます！

```bash
$ git clone https://github.com/elixir-lang/elixir.git
$ cd elixir
$ make clean test
```

問題なければいいですが、もし何か気づいたことがありましたら、いつでも気軽に Issue をください！
[in the issues tracker on Github](https://github.com/elixir-lang/elixir)

## Installing Erlang

The only prerequisite for Elixir is Erlang, version {{ stable.minimum_otp }} or later, which can be easily installed with [Precompiled packages](https://www.erlang-solutions.com/resources/download.html). In case you want to install it directly from source, it can be found on [the Erlang website](http://www.erlang.org/download.html) or by following the excellent tutorial available in the [Riak documentation](https://docs.basho.com/riak/latest/ops/building/installing/erlang/).

For Windows developers, we recommend the precompiled packages. Those on a Unix platform can probably get Erlang installed via one of the many package distribution tools.

After Erlang is installed, you should be able to open up the command line (or command prompt) and check the Erlang version by typing `erl`. You will see some information similar to:

    Erlang/OTP {{ stable.minimum_otp }} [64-bit] [smp:2:2] [async-threads:0] [hipe] [kernel-poll:false]

Notice that depending on how you installed Erlang, Erlang binaries might not be available in your PATH. Be sure to have Erlang binaries in your [PATH](https://en.wikipedia.org/wiki/Environment_variable), otherwise Elixir won't work!

## Setting PATH environment variable

It is highly recommended to add Elixir's bin path to your PATH environment variable to ease development.

On **Windows**, there are [instructions for different versions](http://www.computerhope.com/issues/ch000549.htm) explaining the process.

On **Unix systems**, you need to [find your shell profile file](https://unix.stackexchange.com/a/117470/101951), and then add to the end of this file the following line reflecting the path to your Elixir installation:

```bash
export PATH="$PATH:/path/to/elixir/bin"
```

## Checking the installed version of Elixir

Once you have Elixir installed, you can check its version by running `elixir --version`.
