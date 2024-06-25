---
layout: post
title: Elixir v1.15 released
author: José Valim
category: Releases
excerpt: Elixir v1.15 with improvements to compilation and boot times.
---

Elixir v1.15 has just been released. 🎉

Elixir v1.15 is a smaller release with focused improvements
on compilation and boot times. This release also completes
our integration process with Erlang/OTP logger, bringing new
features such as log rotation and compression out of the box.

You will also find additional convenience functions in `Code`,
`Map`, `Keyword`, all Calendar modules, and others.

Finally, we are glad to welcome [Jean Klingler](https://github.com/sabiwara/)
as a member of the Elixir Core team. Thank you for your contributions!

## Compile and boot-time improvements

The last several releases brought improvements to compilation
time and this version is no different. In particular, Elixir
now caches and prunes load paths before compilation, ensuring your
project (and dependencies!) compile faster and in an environment
closer to production.

In a nutshell, the Erlang VM loads modules from code paths. Each
application that ships with Erlang and Elixir plus each dependency
become an entry in your code path. The larger the code path, the
more work Erlang has to do in order to find a module.

In previous versions, Mix would only add entries to the load paths.
Therefore, if you compiled 20 dependencies and you went to compile
the 21st, the code path would have 21 entries (plus all Erlang and
Elixir apps). This allowed modules from unrelated dependencies to
be seen and made compilation slower the more dependencies you had.
With this release, we will now prune the code paths to only the ones
listed as dependencies, bringing the behaviour closer to `mix release`.

Furthermore, Erlang/OTP 26 allows us to start applications
concurrently and cache the code path lookups, decreasing the cost of
booting applications. The combination of Elixir v1.15 and Erlang/OTP 26
should also reduce the boot time of applications, such as when starting
`iex -S mix` or running a single test with `mix test`.

As an example, I have benchmarked [the Livebook application](https://github.com/livebook-dev/livebook)
on a M1 Max MacStudio across different Elixir and Erlang/OTP versions.
At the time of benchmarking, Livebook had ~200 source `.ex` files and
~35 dependencies. Compilation-times were improved by 16%:

![Livebook compilation times](/images/contents/livebook-compile-1.15.png)

Livebook saw an improvement of 30% on boot times:

![Livebook boot times](/images/contents/livebook-boot-1.15.png)

Different application will see different results. Our expectations
are the gains will be more meaningful the more dependencies you have,
the more files you have, and the more cores you have. We have even
received reports of up to 40% faster compilation times, although it
is yet unclear how generalizable this will be in practice. Note this
work does not improve the time to compile slow individual files.

The compiler is also smarter in several ways: `@behaviour` declarations
no longer add compile-time dependencies and aliases in patterns and
guards add no dependency whatsoever, as no dispatching happens. Furthermore,
Mix now tracks the digests of `@external_resource` files, reducing the
amount of recompilation when swapping branches. Finally, dependencies
are automatically recompiled when their compile-time configuration changes,
providing a smoother development experience.

##### Potential incompatibilities

Due to the code path pruning, if you have an application or dependency
that does not specify its dependencies on Erlang/OTP and core Elixir applications,
which has always been erroneus behaviour, it may no longer compile
successfully in Elixir v1.15. You can temporarily disable code path pruning
by setting `prune_code_paths: false` in your `mix.exs`, although doing so
may lead to runtime bugs that are only manifested inside a `mix release`.

## Compiler warnings and errors

The Elixir compiler can now emit many errors for a single file, making
sure more feedback is reported to developers before compilation is aborted.

In Elixir v1.14, an undefined function would be reported as:

    ** (CompileError) undefined function foo/0 (there is no such import)
        my_file.exs:1

In Elixir v1.15, the new reports will look like:

    error: undefined function foo/0 (there is no such import)
      my_file.exs:1

    ** (CompileError) my_file.exs: cannot compile file (errors have been logged)

A new function, called `Code.with_diagnostics/2`, has been added so this
information can be leveraged by editors, allowing them to point to several
errors at once. We have currently ongoing work and contribution to further
improve the compiler diagnostics in future Elixir releases.

##### Potential incompatibilities

As part of this effort, the behaviour where undefined variables were transformed
into nullary function calls, often leading to confusing error reports, has
been disabled during project compilation. You can invoke `Code.compiler_options(on_undefined_variable: :warn)`
at the top of your `mix.exs` to bring the old behaviour back.

## Integration with Erlang/OTP logger

This release provides additional features such as global logger
metadata and [file logging](https://hexdocs.pm/logger/Logger.html#module-erlang-otp-handlers) (with rotation and compression) out of the box!

This release also soft-deprecates Elixir's Logger Backends in
favor of Erlang's Logger handlers. Elixir will automatically
convert your `:console` backend configuration into the new
configuration. Previously, you would set:

```elixir
config :logger, :console,
  level: :error,
  format: "$time $message $metadata"
```

Which is now translated to the equivalent:

```elixir
config :logger, :default_handler,
  level: :error

config :logger, :default_formatter,
  format: "$time $message $metadata"
```

To replace the default console handler by one that writes to disk,
with log rotation and compression:

```elixir
config :logger, :default_handler,
  config: [
    file: ~c"system.log",
    filesync_repeat_interval: 5000,
    file_check: 5000,
    max_no_bytes: 10_000_000,
    max_no_files: 5,
    compress_on_rotate: true
  ]
```

Finally, the previous Logger Backends API is now soft-deprecated.
If you implement your own backends, you want to consider migrating to
[`:logger_backends`](https://github.com/elixir-lang/logger_backends)
in the long term. See the new [`Logger`](https://hexdocs.pm/logger)
documentation for more information on the new features and compatibility.

## Learn more

For a complete list of all changes, see the
[full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.15.0).

Check [the Install section](/install.html) to get Elixir installed and
read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html)
to learn more.

Happy compiling!
