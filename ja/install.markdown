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

## ディストリビューション

お好きなオプションをお選びいただけます。あなたのシステムに Elixir をインストールしましょう！

以前に一度 Elixir/Erlang をインストールしたことがあるのでしたら、 "Compiling with version managers" や " Compiling form source (Unix and MinGW) " を参照してください。

### macOS(Mac OS X)

  * Homebrew をお使いの場合
    * Homebrew を最新バージョンにアップデート: `brew update`
    * インストール: `brew install elixir`
  * Macports をお使いの場合
    * インストール: `sudo port install elixir`

### UNIX 系

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

  * インタラクティブモード
    * Run: `docker run -it --rm elixir`
  * イメージからインストールしたコンテナ内で bash シェルを起動
    * Run: `docker run -it --rm elixir bash`

これらのディストリビューションは、たいてい自動で Erlang もインストールしてくれますが、もしインストールされない場合は [Installing Erlang](/install.html#installing-erlang)(英語) を参照してください.

プリコンパイル済みパッケージのリストが必要でしたら、こちらからどうぞ。[https://elixir-lang.org/elixir.csv](https://elixir-lang.org/elixir.csv).

## プリコンパイル済みパッケージ

Elixir はリリースごとにプリコンパイル済みパッケージをご用意しています。まずはじめに [Erlangをインストール](/install.html#installing-erlang) します。次に [最新の Precopiled.zip ファイル](https://github.com/elixir-lang/elixir/releases/download/v{{ stable.version }}/Precompiled.zip)をダウンロード後、解凍してください。.

一度ファイルを解凍すると 'bin' ディレクトリから 'elixir' や 'iex' コマンドを使用できますが、Elixir へのパスを環境変数 PATH に追加した方が効率的でしょう。
詳しくは [環境変数にパスを追加する](#setting-path-environment-variable) を参照してください。

## バージョン管理ツールを使用する

それぞれバージョンの異なる Erlang や Elixir をインストールして、それらを管理できるようにするツールというのはいくつかあります。

  * [asdf](https://github.com/asdf-vm/asdf) - Erlang と Elixir の複数バージョンをインストールし管理ができます。
  * [exenv](https://github.com/mururu/exenv) - 〃
  * [kiex](https://github.com/taylor/kiex) - 〃
  * [kerl](https://github.com/yrashk/kerl) - 〃

Keep in mind that each Elixir version supports specific Erlang/OTP versions. [Check the compatibility table](https://hexdocs.pm/elixir/compatibility-and-deprecations.html#compatibility-between-elixir-and-erlang-otp) if you have questions or run into issues.

If you would prefer to compile from source manually, don't worry, we got your back too.

## ソースファイルから直接コンパイルする (UNIX 系や MinGW)

Elixir のダウンロードやコンパイルの前に、まず [Erlang をインストール](/install.html#installing-erlang) してください。

そうしましたら次は [最新バージョン](https://github.com/elixir-lang/elixir/releases/tag/v{{ stable.version }}) の Elixir のソースコード ([.zip](https://github.com/elixir-lang/elixir/archive/v{{ stable.version }}.zip), [.tar.gz](https://github.com/elixir-lang/elixir/archive/v{{ stable.version }}.tar.gz)) をダウンロードしましょう。ファイルを解凍してディレクトリに移動し、 `make` コマンドを実行します。(note: Windows をお使いの方は [Windows 環境に Elixir をコンパイルする方法](https://github.com/elixir-lang/elixir/wiki/Windows))を参照してください。)

コンパイルが完了すると `bin` ディレクトリから `iex` コマンドで Elixir の REPL を起動できます。手軽な開発の為にも [Elixir を環境変数 PATH に追加](#setting-path-environment-variable) することをおすすめします。

好奇心旺盛な方なら master ブランチから開発途中の Elixir もコンパイルしてお試しいただけます！

```bash
$ git clone https://github.com/elixir-lang/elixir.git
$ cd elixir
$ make clean test
```

問題なければいいのですが、もし何か気づいたことがありましたら、いつでも気軽に Issue をください！
[in the issues tracker on Github](https://github.com/elixir-lang/elixir)

## Erlang をインストールする

Elixir に必要な要件は、 {{ stable.minimum_otp }} 以降の Erlang だけです。 [パッケージをプリコンパイル](https://www.erlang-solutions.com/resources/download.html)(英語) して簡単にインストールできます。ソースファイルからある特定のディレクトリにインストールしたい場合は、[Erlang 公式 Web サイト](http://www.erlang.org/download.html)(英語) をお探しいただくか、 [Riak ドキュメント (Installing Erlang)](https://docs.basho.com/riak/latest/ops/building/installing/erlang/)(英語) がとても参考になるはずです。

Windows をご利用されている開発者にはプリコンパイル済みのパッケージをおすすめします。Unix 系ディストリビューションでは、大抵それぞれに用意されたツールを用いて Erlang をインストールできます。

Erlang のインストールが終わりましたら、コマンドラインやコマンドプロンプトを開き、 `erl` コマンドでバージョンを確認しましょう。以下のような情報がいくつか表示されるはずです。

    Erlang/OTP {{ stable.minimum_otp }} [64-bit] [smp:2:2] [async-threads:0] [hipe] [kernel-poll:false]

Erlang のインストールの仕方によっては、環境変数 PATH からコマンドを利用できないことがあるかも知れません。その場合は PATH を適切に設定してください。そうでなければ、 Elixir を正常に利用できません。PATH (環境変数) という用語については [PATH](https://ja.wikipedia.org/wiki/環境変数) を参照してください。

## 環境変数を設定する

効率的な開発の為にも、Elixir コマンドのパスを環境変数 PATH に設定しておくことを強くおすすめします。

**Windows をご利用の方** : 環境変数 PATH の設定が OS のバージョンによって異なります。 [各バージョンごとの取扱](http://www.computerhope.com/issues/ch000549.htm)(英語) で手順の説明をご用意していますので参考にしてください。

**Unix 系ご利用の方** : Elixir のインストールを終えましたら、コマンドを探索する為に [ログインプロファイル](https://unix.stackexchange.com/a/117470/101951)(英語) を作成し、エディタで開いたのちに以下の一行を入力して保存します。設定ファイルがすでに存在する場合は一番最後の行に書き加えてください。

```bash
export PATH="$PATH:/path/to/elixir/bin"
```

## インストール済み Elixir を確認する

一度 Elixir のインストールを終わらせると、 `elixir --version` と入力すればバージョンを確認できます。
