---
layout: post
title: Elixir on Xen
author: José Valim
category: Announcements
excerpt: The Erlang on Xen team has added support for Elixir and we will tell you how you can use it!
---

Elixir uses Erlang underneath, all the way down. Thanks to this, an Elixir project can run on the recently revealed "OS-less" Erlang VM called LING VM. LING VM is the core technology of [Erlang on Xen](http://erlangonxen.org).

## Why Xen?

[Xen](https://en.wikipedia.org/wiki/Xen) is an open-source baremetal hypervisor that allows many operating systems to run on the same hardware. Xen is frequently used for server virtualization, Infrastructure as a Service (IaaS) and security applications.

Elixir on Xen runs on top of the Xen Hypervisor (via the LING VM) but with no traditional OS underneath it, taking away numerous administrative, scalability, and performance issues. This  limits options of a malicious attacker, making it an excellent choice for high-security applications, and reduces startup latency, allowing developers to spawn new VMs in less than 100 milliseconds.

You can learn more about Xen and the LING VM on the [Erlang on Xen website](http://erlangonxen.org).

## Getting started

In order to run Elixir on the LING VM, you need to produce a Xen image of your Elixir project. This can be done with the help of the [lingex project](https://github.com/maximk/lingex), created by the LING VM team.

Producing an Elixir image using the free Erlang on Xen Build Service requires just a few steps:

1. Add a dependency on `lingex` to your `mix.exs` file:

          def deps do
            [ { :lingex, github: "maximk/lingex" } ]
          end

2. Run `mix deps.get` to update your dependencies. This adds a few custom tasks
to the mix tool (`lingex.build`, `lingex.image`, and `lingex.build_image`)

3. Set `lingex` options. Add the following lines to your `mix.exs` file:

          def project do
            [ lingex_opts: [
                build_host: "build.erlangonxen.org:8080",
          			username: "test",
          			password: "test" ] ]
          end

4. Optionally, you may register with the build service [here](http://build.erlangonxen.org/register) and update the credentials accordingly. For the complete list of recognized options see the build service documentation.

5. Run `mix lingex.build_image`. This will archive all `*.beam` files of your project and submit them to the build service.

6. The build process will complete in about 30s. An image file called 'vmling' will appear in the current directory, ready to boot as a Xen guest. The image file will contain LING VM and your project code.

And this is all. Erlang on Xen is going to boot the Erlang VM and the standard Erlang shell. You can access Elixir shell in a couple steps:

1. In the Erlang shell, first start IEx:

          1> application:start(iex).
          ok

2. Then hit `Ctrl+G`. This will open up the user switch command interface from the Erlang shell.

3. In the user switch interface, type:

          User switch command
           --> s 'Elixir.IEx'
           --> c

This will bring you to Interactive Elixir and you can execute Elixir expressions as usual!

## Summing up

Running Elixir on Xen opens up many possibilities to Elixir developers. We are very thankful for the work done by [Erlang on Xen team](http://erlangonxen.org), who added support for Elixir and the `lingex` build tool.

Erlang on Xen (and consequently Elixir on Xen) is still in active development, so don't forget to read more about its concepts, use cases and limitations on [Erlang on Xen website](http://erlangonxen.org/).
