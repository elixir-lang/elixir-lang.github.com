---
title: "Installing Elixir"
section: install
layout: default
---
## Installing Erlang

The only prerequisite for Elixir is Erlang, version 17.0 or later, which can be easily installed with [Precompiled packages](https://www.erlang-solutions.com/downloads/download-erlang-otp). In case you want to install it directly from source, it can be found on [the Erlang website](http://www.erlang.org/download.html) or by following the excellent tutorial available in the [Riak documentation](http://docs.basho.com/riak/1.3.0/tutorials/installation/Installing-Erlang/).

For Windows developers, we recommend the precompiled packages. Those on a Unix platform can probably get Erlang installed via one of the many package distribution tools.

After Erlang is installed, you should be able to open up the command line (or command prompt) and check the Erlang version by typing `erl`. You will see some information as follows:

    Erlang/OTP 17 (erts-6) [64-bit] [smp:2:2] [async-threads:0] [hipe] [kernel-poll:false]

Notice that depending on how you installed Erlang, Erlang binaries won't be available in your PATH. Be sure to have Erlang binaries in your [PATH](http://en.wikipedia.org/wiki/Environment_variable), otherwise Elixir won't work!


## Installing Elixir

The quickest way to install Elixir is through a distribution or using one of the available installers. If not available, then we recommend the precompiled packages or compiling from source.

### 1 Distributions

Choose your operating system and tool.

#### Mac OS X

  * Homebrew
    * Update your homebrew to latest: `brew update`
    * Run: `brew install elixir`
  * Macports
    * Run: `sudo port install elixir`

#### Unix (and Unix-like)

  * Fedora 17+ and Fedora Rawhide
    * Run: `sudo yum -y install elixir`
  * Arch Linux (on AUR)
    * Run: `yaourt -S elixir`
  * openSUSE (and SLES 11 SP3+)
    * Add Erlang devel repo: `zypper ar -f obs://devel:languages:erlang/ erlang`
    * Run: `zypper in elixir`
  * Gentoo
    * Run: `emerge --ask dev-lang/elixir`
  * FreeBSD
    * From ports: `cd /usr/ports/lang/elixir && make install clean`
    * From pkg: `pkg install elixir`
  * Ubuntu 12.04 and 14.04 / Debian 7
    * Add Erlang Solutions repo: `wget http://packages.erlang-solutions.com/erlang-solutions_1.0_all.deb && sudo dpkg -i erlang-solutions_1.0_all.deb`
    * Run: `sudo apt-get update`
    * Run: `sudo apt-get install elixir`

#### Windows

  * Web installer
    * [Download the installer](http://s3.hex.pm/elixir-websetup.exe)
    * Click next, next, ..., finish
  * Chocolatey
    * `cinst elixir`

Those distributions will likely install Erlang automatically for you too. In case they don't, check the [Installing Erlang](/install.html#4-installing-erlang) section below.

### 2 Precompiled package

Elixir provides a precompiled package for every release. First [install Erlang](/install.html#4-installing-erlang) and then download and unzip the [Precompiled.zip file for the latest release](https://github.com/elixir-lang/elixir/releases/).

Once the release is unpacked, you are ready to run the `elixir` and `iex` commands from the `bin` directory. It is recommended that you add Elixir's `bin` path to your PATH environment variable to ease development.

    $ export PATH="$PATH:/path/to/elixir/bin"

### 3 Compiling from source (Unix and MinGW)

You can download and compile Elixir in few steps. The first one is to [install Erlang](/install.html#4-installing-erlang).

Next you should download the [latest release](https://github.com/elixir-lang/elixir/releases/), unpack it and then run `make` inside the unpacked directory (note: if you are running on Windows, [read this page on setting up your environment for compiling Elixir](https://github.com/elixir-lang/elixir/wiki/Windows)).

After compiling, you are ready to run the `elixir` and `iex` commands from the `bin` directory. It is recommended that you add Elixir's `bin` path to your [PATH](http://en.wikipedia.org/wiki/Environment_variable) environment variable to ease development:

    $ export PATH="$PATH:/path/to/elixir/bin"

In case you are feeling a bit more adventurous, you can also compile from master:

    $ git clone https://github.com/elixir-lang/elixir.git
    $ cd elixir
    $ make clean test

If the tests pass, you are ready to go. Otherwise, feel free to open an issue [in the issues tracker on Github](https://github.com/elixir-lang/elixir).


