---
layout: post
title: Elixir on Xen
author: José Valim
category: Announcements
excerpt: The Erlang on Xen team has added support to Elixir and we will tell you how you can use it!
---

Elixir uses Erlang underneath, all the way down. Thus an Elixir project can run not only on a standard Erlang VM, but on its &ldquo;OS-less&rdquo; counterpart called LING VM. LING VM is the core technology of [Erlang on Xen](http://erlangonxen.org).

## Why Xen?

Elixir on Xen runs directly on top of Xen Hypervisor, this means there is no traditional OS underneath it, taking away numerous administrative, scalability, and performance issues. The LING Virtual Machine runs on its own sand-box being a great fit for highly-secure applications and its fast boot time makes it truly elastic. You can learn more about it on the [Erlang on Xen website](http://erlangonxen.org).

## Getting started

In order to run Elixir on the LING VM, you need to produce a Xen image of your Elixir project. This can be done with the help of the [lingex project](http://github.com/maximk/lingex), created by the LING VM team.

To produce the Elixir image using the free Erlang on Xen Build Service requires just a few steps:

1. Add a dependency on `lingex` to your `mix.exs` file:

    {% highlight elixir %}
    def deps do
      [ { :lingex, github: "maximk/lingex" } ]
    end
    {% endhighlight %}

2. Run `mix deps.get` to update your dependencies. This adds a few custom tasks
to the mix tool (`lingex.build`, `lingex.image`, and `lingex.build_image`)

3. Set `lingex` options. Add the following lines to your `mix.exs` file:

    {% highlight elixir %}
    def project do
      [ lingex_opts: [
          build_host: "build.erlangonxen.org:8080",
    			username: "test",
    			password: "test" ] ]
    end
    {% endhighlight %}

4. Optionally, you may register with the build service [here](http://build.erlangonxen.org/register) and update the credentials accordingly. For the complete list of recognized options see the build service documentation.

5. Run `mix lingex.build_image`. This will archive all `*.beam` files of your project and submit them to the build service.

6. The build process will complete in about 30s. An image file called 'vmling' will appear in the current directory. The file contains LING VM, your project code and is ready to boot as a Xen guest.

And this is all. Erlang on Xen is going to boot the Erlang VM and the standard Erlang shell. You can access Elixir shell in a couple steps:

1. In the Erlang shell, first start IEx:

    {% highlight elixir %}
    1> application:start(iex).
    ok
    {% endhighlight %}


2. Then hit `Ctrl+G`. This will open up the user switch command interface from the Erlang shell.

3. In the user switch interface, type:

    User switch command
     --> s 'Elixir-IEx'
     --> c

This will bring you to Interactive Elixir and you can execute Elixir expressions regularly!

## Summing up

Running Elixir on Xen opens up many possibilities to Elixir developers. We are very thankful for the work done by [Erlang on Xen team](http://erlangonxen.org), who added support to Elixir and the `lingex` build tool.

Erlang on Xen (and consequently Elixir on Xen) is still in active development, so don't forget to read more about it, use cases and limitations on [Erlang on Xen website](http://erlangonxen.org/).
