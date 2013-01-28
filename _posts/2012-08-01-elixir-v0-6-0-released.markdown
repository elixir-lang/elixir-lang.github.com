---
layout: post
title: Elixir v0.6.0 released
author: José Valim
category: Releases
excerpt: We have finally released Elixir v0.6.0! This release includes a build tool called Mix, support for Erlang typespecs, many improvements to IEx and improved IO, File and Macro support.

---

We have finally released [Elixir](http://elixir-lang.org/) v0.6.0! This release includes a build tool called Mix, support for Erlang typespecs, many improvements to IEx and improved IO, File and Macro support.

## What's new

When [we released version v0.5.0](http://elixir-lang.org/blog/2012/05/25/elixir-v0-5-0-released/), we have set three major goals for release v0.6.0:

1. Provide a build tool that makes it easy to create, compile and test Elixir projects;
2. Support [Erlang typespecs](http://www.erlang.org/doc/reference_manual/typespec.html);
3. Improve IO and File modules to be more robust and complete.

We have not only achieved those goals for this release, as we have added much more! A couple weeks ago, we have covered some of these unscheduled improvements, as improved Macro handling and Range support, which you can read more about in the ["What's new in Elixir #5" post](http://elixir-lang.org/blog/2012/07/05/what-s-new-in-elixir-5/).

Our interactive shell (IEx) also had many improvements, thanks to the Elixir developer community. We now have easy access to documentation, remote shells, autocomplete and much more. In order to show you a bit of what you can do in this release, we have prepared a short (~6 min) screencast:

<iframe src="http://player.vimeo.com/video/46709928" width="600" height="337" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe> <p><a href="http://vimeo.com/46709928">Elixir v0.6 quick tour - Mix and IEx</a> from <a href="http://vimeo.com/user3182384">Plataformatec</a> on <a href="http://vimeo.com">Vimeo</a>.</p>

That's it. Of course the documentation was also improved in the process, including two brand new getting started chapters on [Mix](/getting_started/mix/1.html) and [ExUnit](/getting_started/ex_unit/1.html). For the next months, we will continue improving Elixir (you can see some ideas floating around in the [issues tracker](github.com/elixir-lang/elixir/issues)) but we will start to focus on other tools and libraries for the community.

Thank you and don't forget to [give Elixir a try](/getting_started/1.html)!