---
layout: getting-started
title: Where to go next
redirect_from: /getting_started/21.html
---

# {{ page.title }}

{% include toc.html %}

Eager to learn more? Keep reading!

## Build your first Elixir project

In order to get your first project started, Elixir ships with a build tool called Mix. You can get your new project started by simply running:

    mix new path/to/new/project

We have written a guide that covers how to build an Elixir application, with its own supervision tree, configuration, tests and more. The application works as a distributed key-value store where we organize key-value pairs into buckets and distribute those buckets across multiple nodes:

* [Mix and OTP](/getting-started/mix-otp/introduction-to-mix.html)

## Community and other resources

On the sidebar, you can find links to Elixir books and screencasts. There are plenty of Elixir resources out there, like conference talks, open source projects, and other learning material produced by the community.

Remember that in case of any difficulties, you can always visit the **#elixir-lang** channel on **irc.freenode.net** or send a message to the [mailing list](http://groups.google.com/group/elixir-lang-talk). You can be sure that there will be someone willing to help. To keep posted on the latest news and announcements, follow the [blog](/blog/) and follow the language development on the [elixir-core mailing list](http://groups.google.com/group/elixir-lang-core).

Don't forget that you can also check the [source code of Elixir itself](https://github.com/elixir-lang/elixir), which is mostly written in Elixir (mainly the `lib` directory), or [explore Elixir's documentation](/docs.html).

## A byte of Erlang

As the main page of this site puts it:

> Elixir is a programming language built on top of the Erlang <abbr title="Virtual Machine">VM</abbr>.

Sooner or later, an Elixir developer will want to interface with existing Erlang libraries. Here's a list of online resources that cover Erlang's fundamentals and its more advanced features:

* This [Erlang Syntax: A Crash Course](/crash-course.html) provides a concise intro to Erlang's syntax. Each code snippet is accompanied by equivalent code in Elixir. This is an opportunity for you to not only get some exposure to Erlang's syntax but also review some of the things you have learned in this guide.

* Erlang's official website has a short [tutorial](http://www.erlang.org/course/concurrent_programming.html) with pictures that briefly describe Erlang's primitives for concurrent programming.

* [Learn You Some Erlang for Great Good!](http://learnyousomeerlang.com/) is an excellent introduction to Erlang, its design principles, standard library, best practices and much more. If you are serious about Elixir, you'll want to get a solid understanding of Erlang principles. Once you have read through the crash course mentioned above, you'll be able to safely skip the first couple of chapters in the book that mostly deal with the syntax. When you reach [The Hitchhiker's Guide to Concurrency](http://learnyousomeerlang.com/the-hitchhikers-guide-to-concurrency) chapter, that's where the real fun starts.
