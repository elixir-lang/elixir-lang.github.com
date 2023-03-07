---
title: "Installing Elixir"
section: install
layout: default
---
{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}

# Install

{% include toc.html %}

The quickest way to install Elixir is through a distribution or using one of the available installers. If not available, then we recommend the precompiled packages or compiling it.

Note that Elixir {{ stable.name }} requires Erlang {{ stable.minimum_otp }} or later. Many of the instructions below will automatically install Erlang for you. In case they do not, read the "Installing Erlang" section below.

## Distributions

The preferred option for installing Elixir. Choose your operating system and tool.

**If your distribution contains an old Elixir/Erlang version, see the sections below for installing Elixir/Erlang from version managers or from source**.

### macOS

  - Using [Homebrew](https://brew.sh/):
    * Run: `brew install elixir`

  - Using [Macports](https://www.macports.org/):
    * Run: `sudo port install elixir`

### GNU/Linux

  - **Alpine Linux** (Community repository)
    * Run: `apk add elixir`

  - **Arch Linux** (Community repository)
    * Run: `pacman -S elixir`

  - **Debian**
    * Run: `sudo apt-get install elixir`

  - **Fedora 21 (and older)**
    * Run: `yum install elixir`

  - **Fedora 22 (and newer)**
    * Run `dnf install elixir erlang`

  - **Gentoo**
    * Run: `emerge --ask dev-lang/elixir`

  - **GNU Guix**
    * Run: `guix package -i elixir`

  - **openSUSE (and SLES)**
    * Add Elixir/Erlang repository: `zypper ar -f obs://devel:languages:erlang/ Elixir-Factory`
    * Run: `zypper in elixir`
    * Optional: if you want to use the latest Erlang, you can use this repository: `zypper ar -f  obs://devel:languages:erlang:Factory Erlang-Factory`

  - **Slackware**
    * Using Sbopkg:
      * Run: `sbopkg -ki "erlang-otp elixir"`
    * Manually:
      * Download, build and install from SlackBuilds.org: [`erlang-otp`](https://slackbuilds.org/repository/14.2/development/erlang-otp/), and [`elixir`](https://slackbuilds.org/repository/14.2/development/elixir)

  - **Solus**
    * Run: `eopkg install elixir`

  - **Ubuntu**
    * Run: `sudo apt-get install elixir`
 
  - **Void Linux**
    * Run: `xbps-install -S elixir`
    
### BSD

  - **FreeBSD**
    * The latest Elixir release is named [lang/elixir-devel](https://freshports.org/lang/elixir-devel).
      The default Elixir, [lang/elixir](https://freshports.org/lang/elixir), may
      lag slightly as dependent ports are often not able to be updated to the
      newest Elixir release immediately.
    * Using ports:
      * Run: `cd /usr/ports/lang/elixir && make install clean`
    * Using pkg:
      * Run: `pkg install elixir` or `pkg install elixir-devel`

  - **OpenBSD**
    * Run: `pkg_add elixir`

### Windows

  - Using our web installer:
    * [Download the installer](https://github.com/elixir-lang/elixir-windows-setup/releases/download/v2.4/elixir-websetup.exe)
    * Click next, next, ..., finish
    * If you run into issues, check out the [Windows Installer issues tracker](https://github.com/elixir-lang/elixir-windows-setup)

  - Using Scoop:
    * Install Erlang: `scoop install erlang`
    * Install Elixir: `scoop install elixir`

  - Using [Chocolatey](https://community.chocolatey.org/):
    * Install Elixir (installs Erlang as a dependency): `choco install elixir`

### Raspberry Pi and embedded devices

To build and package an Elixir application, with the whole operating system, and burn that into a disk or deploy it overwhere, [check out the Nerves project](https://www.nerves-project.org).

If you want to install Elixir as part of an existing Operating System, please follow the relevant steps above for your Operating System or install from precompiled/source.

### Docker

If you are familiar with Docker you can use the official Docker image to get started quickly with Elixir.

  * Enter interactive mode
    * Run: `docker run -it --rm elixir`
  * Enter bash within container with installed `elixir`
    * Run: `docker run -it --rm elixir bash`

The above will automatically point to the latest Erlang and Elixir available. For production usage, we recommend using [Hex.pm Docker images](https://hub.docker.com/r/hexpm/elixir), which are immutable and point to a specific Erlang and Elixir version.

## Precompiled package

Elixir provides a precompiled package for every release. First [install Erlang](/install.html#installing-erlang) and then download the appropriate precompiled Elixir below. You can consult your Erlang/OTP version by running `erl -s halt`:

{% for otp_version in stable.otp_versions %}
  * [Elixir {{ stable.version }} on Erlang {{ otp_version }}](https://github.com/elixir-lang/elixir/releases/download/v{{ stable.version }}/elixir-otp-{{ otp_version }}.zip){% endfor %}

Once you download the release, unpack it, and you are ready to run the `elixir` and `iex` commands from the `bin` directory. However, we recommend you to [add Elixir's bin path to your PATH environment variable](#setting-path-environment-variable) to ease development.

### Mirrors and nightly builds

The links above point directly to the GitHub release. We also host and mirror precompiled packages and nightly builds globally via `repo.hex.pm` using the following URL scheme:

    https://repo.hex.pm/builds/elixir/${ELIXIR_VERSION}-otp-${OTP_VERSION}.zip

For example, to use Elixir v1.13.3 with Erlang/OTP 24.x, use:

    https://repo.hex.pm/builds/elixir/v1.13.3-otp-24.zip

To use nightly for a given Erlang/OTP version (such as 25), use:

    https://repo.hex.pm/builds/elixir/main-otp-25.zip

## Compiling with version managers

There are many tools that allow developers to install and manage multiple Erlang and Elixir versions. They are useful if you have multiple projects running on different Elixir or Erlang versions, can't install Erlang or Elixir as mentioned above or if the version provided by your package manager is outdated. Here are some of those tools:

  * [asdf](https://github.com/asdf-vm/asdf) - install and manage different [Elixir](https://github.com/asdf-vm/asdf-elixir) and [Erlang](https://github.com/asdf-vm/asdf-erlang) versions
  * [kiex](https://github.com/taylor/kiex) - install and manage different Elixir versions
  * [kerl](https://github.com/yrashk/kerl) - install and manage different Erlang versions

Keep in mind that each Elixir version supports specific Erlang/OTP versions. [Check the compatibility table](https://hexdocs.pm/elixir/compatibility-and-deprecations.html#compatibility-between-elixir-and-erlang-otp) if you have questions or run into issues.

If you would prefer to compile from source manually, don't worry, we got your back too.

## Compiling from source (Unix and MinGW)

You can download and compile Elixir in few steps. The first one is to [install Erlang](/install.html#installing-erlang).

Next you should download source code ([.zip](https://github.com/elixir-lang/elixir/archive/v{{ stable.version }}.zip), [.tar.gz](https://github.com/elixir-lang/elixir/archive/v{{ stable.version }}.tar.gz)) of the [latest release](https://github.com/elixir-lang/elixir/releases/tag/v{{ stable.version }}), unpack it and then run `make` inside the unpacked directory (note: if you are running on Windows, [read this page on setting up your environment for compiling Elixir](https://github.com/elixir-lang/elixir/wiki/Windows)).

After compiling, you are ready to run the elixir and `iex` commands from the bin directory. It is recommended that you [add Elixir's bin path to your PATH environment variable](#setting-path-environment-variable) to ease development.

In case you are feeling a bit more adventurous, you can also compile from main:

```bash
$ git clone https://github.com/elixir-lang/elixir.git
$ cd elixir
$ make clean test
```

If the tests pass, you are ready to go. Otherwise, feel free to open an issue [in the issues tracker on GitHub](https://github.com/elixir-lang/elixir).

## Installing Erlang

The only prerequisite for Elixir is Erlang, version {{ stable.minimum_otp }} or later. When installing Elixir, Erlang is generally installed automatically for you. However, if you want to install Erlang manually, you might check:

  * [Source code distribution and Windows installers from Erlang's official website](http://www.erlang.org/downloads.html)
  * [Precompiled packages for some Unix-like installations](https://www.erlang-solutions.com/resources/download.html)
  * [A general list of installation methods from the Riak documentation](https://docs.riak.com/riak/kv/latest/setup/installing/source/erlang/).

After Erlang is installed, you should be able to open up the command line (or command prompt) and check the Erlang version by typing `erl -s erlang halt`. You will see some information similar to:

    Erlang/OTP {{ stable.minimum_otp }} [64-bit] [smp:2:2] [...]

Notice that depending on how you installed Erlang, Erlang binaries might not be available in your PATH. Be sure to have Erlang binaries in your [PATH](https://en.wikipedia.org/wiki/Environment_variable), otherwise Elixir won't work!

## Setting PATH environment variable

It is highly recommended to add Elixir's bin path to your PATH environment variable to ease development.

On Windows, there are [instructions for different versions](http://www.computerhope.com/issues/ch000549.htm) explaining the process.

On Unix systems, you need to [find your shell profile file](https://unix.stackexchange.com/a/117470/101951), and then add to the end of this file the following line reflecting the path to your Elixir installation:

```bash
export PATH="$PATH:/path/to/elixir/bin"
```

## Checking the installed version of Elixir

Once you have Elixir installed, you can check its version by running `elixir --version`.
