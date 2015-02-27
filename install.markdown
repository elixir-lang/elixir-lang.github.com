---
title: "Installing Elixir"
section: install
layout: default
---

# {{ page.title }}

The quickest way to install Elixir is through a distribution or using one of the available installers. If not available, then we recommend the precompiled packages or compiling from source.

Note Elixir requires Erlang 17.0 or later. Many of the instructions below will automatically install Erlang for you. In case they do not, read the "Installing Erlang" section below.

{% include toc.html %}

## Distributions

Choose your operating system and tool.

### Mac OS X

  * Homebrew
    * Update your homebrew to latest: `brew update`
    * Run: `brew install elixir`
  * Macports
    * Run: `sudo port install elixir`

### Unix (and Unix-like)

  * Arch Linux (Community repo)
    * Run: `pacman -S elixir`
  * openSUSE (and SLES 11 SP3+)
    * Add Erlang devel repo: `zypper ar -f obs://devel:languages:erlang/ erlang`
    * Run: `zypper in elixir`
  * Gentoo
    * Run: `emerge --ask dev-lang/elixir`
  * Fedora 17 and newer
    * Run: `yum install elixir`
  * FreeBSD
    * From ports: `cd /usr/ports/lang/elixir && make install clean`
    * From pkg: `pkg install elixir`
  * Ubuntu 12.04 and 14.04 / Debian 7
    * Add Erlang Solutions repo: `wget http://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb && sudo dpkg -i erlang-solutions_1.0_all.deb`
    * Run: `sudo apt-get update`
    * Run: `sudo apt-get install elixir`

### Windows

  * Web installer
    * [Download the installer](http://s3.hex.pm/elixir-websetup.exe)
    * Click next, next, ..., finish
  * Chocolatey
    * `cinst elixir`

Those distributions will likely install Erlang automatically for you too. In case they don't, check the [Installing Erlang](/install.html#4-installing-erlang) section below.

## Precompiled package

Elixir provides a precompiled package for every release. First [install Erlang](/install.html#4-installing-erlang) and then download and unzip the [Precompiled.zip file for the latest release](https://github.com/elixir-lang/elixir/releases/).

Once the release is unpacked, you are ready to run the `elixir` and `iex` commands from the `bin` directory. It is recommended that you add Elixir's bin path to your PATH environment variable to ease development. You need to [find your shell profile file](http://unix.stackexchange.com/a/117470/101951), and add to the end of it: 

On Unix systems, one can do:

```bash
$ export PATH="$PATH:/path/to/elixir/bin"
```

On Windows, there are [instructions for different versions here](http://www.computerhope.com/issues/ch000549.htm).

## Compiling from source (Unix and MinGW)

You can download and compile Elixir in few steps. The first one is to [install Erlang](/install.html#4-installing-erlang).

Next you should download the [latest release](https://github.com/elixir-lang/elixir/releases/), unpack it and then run `make` inside the unpacked directory (note: if you are running on Windows, [read this page on setting up your environment for compiling Elixir](https://github.com/elixir-lang/elixir/wiki/Windows)).

After compiling, you are ready to run the elixir and `iex` commands from the bin directory. It is recommended that you add Elixir's bin path to your PATH environment variable to ease development. You need to [find your shell profile file](http://unix.stackexchange.com/a/117470/101951), and add to the end of it: 

```bash
$ export PATH="$PATH:/path/to/elixir/bin"
```

In case you are feeling a bit more adventurous, you can also compile from master:

```bash
$ git clone https://github.com/elixir-lang/elixir.git
$ cd elixir
$ make clean test
```

If the tests pass, you are ready to go. Otherwise, feel free to open an issue [in the issues tracker on Github](https://github.com/elixir-lang/elixir).

## Installing Erlang

The only prerequisite for Elixir is Erlang, version 17.0 or later, which can be easily installed with [Precompiled packages](https://www.erlang-solutions.com/downloads/download-erlang-otp). In case you want to install it directly from source, it can be found on [the Erlang website](http://www.erlang.org/download.html) or by following the excellent tutorial available in the [Riak documentation](http://docs.basho.com/riak/1.3.0/tutorials/installation/Installing-Erlang/).

For Windows developers, we recommend the precompiled packages. Those on a Unix platform can probably get Erlang installed via one of the many package distribution tools.

After Erlang is installed, you should be able to open up the command line (or command prompt) and check the Erlang version by typing `erl`. You will see some information as follows:

    Erlang/OTP 17 (erts-6) [64-bit] [smp:2:2] [async-threads:0] [hipe] [kernel-poll:false]

Notice that depending on how you installed Erlang, Erlang binaries won't be available in your PATH. Be sure to have Erlang binaries in your [PATH](http://en.wikipedia.org/wiki/Environment_variable), otherwise Elixir won't work!
