---
layout: getting-started
title: Configuration and releases
---

# {{ page.title }}

{% include toc.html %}

{% include mix-otp-preface.html %}

In this last chapter, we will make the routing table for our distributed key-value store configurable, and then finally package the software for production.

Let's do this.

## Application environment

So far we have hardcoded the routing table into the `KV.Router` module. However, we would like to make the table dynamic. This allows us not only to configure development/test/production, but also to allow different nodes to run with different entries in the routing table. There is a feature of <abbr title="Open Telecom Platform">OTP</abbr> that does exactly that: the application environment.

Each application has an environment that stores the application's specific configuration by key. For example, we could store the routing table in the `:kv` application environment, giving it a default value and allowing other applications to change the table as needed.

Open up `apps/kv/mix.exs` and change the `application/0` function to return the following:

```elixir
def application do
  [
    extra_applications: [:logger],
    env: [routing_table: []],
    mod: {KV, []}
  ]
end
```

We have added a new `:env` key to the application. It returns the application default environment, which has an entry of key `:routing_table` and value of an empty list. It makes sense for the application environment to ship with an empty table, as the specific routing table depends on the testing/deployment structure.

In order to use the application environment in our code, we need to replace `KV.Router.table/0` with the definition below:

```elixir
@doc """
The routing table.
"""
def table do
  Application.fetch_env!(:kv, :routing_table)
end
```

We use `Application.fetch_env!/2` to read the entry for `:routing_table` in `:kv`'s environment. You can find more information and other functions to manipulate the app environment in the [Application module](https://hexdocs.pm/elixir/Application.html).

Since our routing table is now empty, our distributed tests should fail. Restart the apps and re-run tests to see the failure:

```console
$ iex --sname bar -S mix
$ elixir --sname foo -S mix test --only distributed
```

We need a way to configure the application environment. That's when we use configuration files.

## Configuration

Configuration files provide a mechanism for us to configure the environment of any application. Such configuration is done by the `config/config.exs` file.

For example, we can configure IEx default prompt to another value. Let's create the `config/config.exs` file with the following content:

```elixir
import Config
config :iex, default_prompt: ">>>"
```

Start IEx with `iex -S mix` and you can see that the IEx prompt has changed.

This means we can also configure our `:routing_table` directly in the `config/config.exs` file. However, which configuration value should we use?

Currently we have two tests tagged with `@tag :distributed`. The "server interaction" test in `KVServerTest`, and the "route requests across nodes" in `KV.RouterTest`. Both tests are failing since they require a routing table, which is currently empty.

The `KV.RouterTest` truly has to be distributed, as its purpose is to test the distribution. However, the test in `KVServerTest` was only made distributed because we had a hardcoded distributed routing table, which we couldn't configure, but now we can!

Therefore, in order to minimize the distributed tests, let's pick a routing table that does not require distribution. Then, for the distributed tests, we will programatically change the routing table. Back in `config/config.exs`, add this line:

```elixir
config :kv, :routing_table, [{?a..?z, node()}]
```

This configures a routing table that always points to the current node. Now remove `@tag :distributed` from the test in `test/kv_server_test.exs` and run the suite, the test should now pass.

Now we only need to make `KV.RouterTest` pass once again. To do so, we will write a setup block that runs before all tests in that file. The setup block will change the application environment and revert it back once we are done, like this:

```elixir
defmodule KV.RouterTest do
  use ExUnit.Case

  setup_all do
    current = Application.get_env(:kv, :routing_table)

    Application.put_env(:kv, :routing_table, [
      {?a..?m, :"foo@computer-name"},
      {?n..?z, :"bar@computer-name"}
    ])

    on_exit fn -> Application.put_env(:kv, :routing_table, current) end
  end

  @tag :distributed
  test "route requests across nodes" do
```

Note we removed `async: true` from `use ExUnit.Case`. Since the application environment is a global storage, tests that modify it cannot run concurrently. With all changes in place, all tests should pass, including the distributed one.

## Custom configuration

At this point, you may be wondering, how can we make two nodes start with two different routing tables? We can introduce a change in our `config/confix.exs` file in order to accept a environment variable called `CFG_NAME` which determines the configuration file that should be used.

```elixir
import Config

import_config "#{Mix.Project.config[:target]}" <> System.get_env("CFG_NAME") <> ".exs"
```

For example, you could write two extra configuration files, `config/foo.exs` and `config/bar.exs`, with two distinct routing tables and then:

    $ CFG_NAME=foo elixir --sname foo -S mix run
    $ CFG_NAME=bar elixir --sname bar -S mix run

There are two concerns with this approach.

First, if the routing tables are the opposite of each other, such as `[{?a..?m, :"foo@computer-name"}, {?n..?z, :"bar@computer-name"}]` in one node and `[{?a..?m, :"bar@computer-name"}, {?n..?z, :"foo@computer-name"}]` in the other, you can have a routing request that will run recursively in the cluster infinitely. This can be tackled at the application level by making sure you pass a list of seen nodes when we route, such as `KV.Router.route(bucket, mod, fun, args, seen_nodes)`. Then by checking if the node being dispatched to was already visited, we can avoid the cycle. Implementing and testing this functionality will be left as an exercise.

The second concern is that, while using `mix run` is completely fine to run our software in production, the command we use to start our services is getting increasingly more complex. For example, imagine we also want to `--preload-modules`, so all code is loaded upfront, as well as set the `MIX_ENV=prod` environment variable:

    $ CFG_NAME=foo MIX_ENV=prod elixir --sname foo -S mix run --preload-modules
    
Luckily, Elixir comes with the ability to package all of the code we have written so far into a single directory, that also includes Elixir and the Erlang Virtual Machine, that has a simple entry point and supports custom configuration. This feature is called releases and it provides many other benefits, which we will see next.

## Releases

A release is a self-contained directory that consists of your application code, all of its dependencies, plus the whole Erlang Virtual Machine (VM) and runtime. Once a release is assembled, it can be packaged and deployed to a target as long as the target runs on the same operating system (OS) distribution and version as the machine that assembled the release.

In a regular project, we can assemble a release by simply running `mix release`. However, we have an umbrella project, and in such cases Elixir requires some extra input from us. Let's see what is necessary:

    $ MIX_ENV=prod mix release
    ** (Mix) Umbrella projects require releases to be explicitly defined with a non-empty applications key that chooses which umbrella children should be part of the releases:

    releases: [
      foo: [
        applications: [child_app_foo: :permanent]
      ],
      bar: [
        applications: [child_app_bar: :permanent]
      ]
    ]

    Alternatively you can perform the release from the children applications

That's because an umbrella project gives us plenty of options when deploying the software. We can:

  * deploy all applications in the umbrella to a node that will work as both TCP server and key-value storage

  * deploy the `:kv_server` application to work only as a TCP server as long as the routing table points only to other nodes

  * deploy only the `:kv` application when we want a node to work only as storage (no TCP access)

As a starting point, let's define a release that includes both `:kv_server` and `:kv` applications. We will also add a version to it. Open up the `mix.exs` in the umbrella root and add inside `def project`:

    releases: [
      foo: [
        version: "0.0.1",
        applications: [kv_server: :permanent, kv: :permanent]
      ]
    ]

That defines a release named `foo` with both `kv_server` and `kv` applications. Their mode is set to `:permanent`, which means that, if those applications crash, the whole node terminates. That's reasonable since those applications are essential to our system. With the configuration in place, let's give assembling the release another try:

    $ MIX_ENV=prod mix release foo
    * assembling foo-0.0.1 on MIX_ENV=prod
    * skipping runtime configuration (config/releases.exs not found)

    Release created at _build/prod/rel/foo!

        # To start your system
        _build/prod/rel/foo/bin/foo start

    Once the release is running:

        # To connect to it remotely
        _build/prod/rel/foo/bin/foo remote

        # To stop it gracefully (you may also send SIGINT/SIGTERM)
        _build/prod/rel/foo/bin/foo stop

    To list all commands:

        _build/prod/rel/foo/bin/foo

Excellent! A release was assembled in `_build/prod/rel/foo`. Inside the release, there will be a `bin/foo` file which is the entry point to your system. It supports multiple commands, such as:

  * `bin/foo start`, `bin/foo start_iex`, `bin/foo restart`, and `bin/foo stop` - for general management of the release

  * `bin/foo rpc COMMAND` and `bin/foo remote` - for running commands on the running system or to connect to the running system

  * `bin/foo eval COMMAND` - to start a fresh system that runs a single command and then shuts down

  * `bin/foo daemon` and `bin/foo daemon_iex` - to start the system as a daemon on Unix-like systems

  * `bin/foo install` - to install the system as a service on Windows machines

If you run `bin/foo start`, it will start the system using a short name (`--sname`) equal to the release name, which in this case is `foo`. The next step is to start a system named `bar`, so we can connect `foo` and `bar` together, like we did in the previous chapter. But before we achieve this, let's talk a bit about the benefits of releases.

## Why releases?

Releases allow developers to precompile and package all of their code and the runtime into a single unit. The benefits of releases are:

  * Code preloading. The VM has two mechanisms for loading code: interactive and embedded. By default, it runs in the interactive mode which dynamically loads modules when they are used for the first time. The first time your application calls `Enum.map/2`, the VM will find the `Enum` module and load it. There's a downside. When you start a new server in production, it may need to load many other modules, causing the first requests to have an unusual spike in response time. Releases run in embedded mode, which loads all available modules upfront, guaranteeing your system is ready to handle requests after booting.

  * Configuration and customization. Releases give developers fine grained control over system configuration and the VM flags used to start the system.

  * Self-contained. A release does not require the source code to be included in your production artifacts. All of the code is precompiled and packaged. Releases do not even require Erlang or Elixir on your servers, as they include the Erlang VM and its runtime by default. Furthermore, both Erlang and Elixir standard libraries are stripped to bring only the parts you are actually using.

  * Multiple releases. You can assemble different releases with different configuration per application or even with different applications altogether.

We have written extensive documentation on releases, so [please check the official docs for more information](https://hexdocs.pm/mix/Mix.Tasks.Release.html). For now, we will continue exploring some of the features outlined above.

## Assembling multiple releases

So far, we have assembled a release named `foo`, but our routing table contains information for both `foo` and `bar`. Let's start `foo`:

    $ _build/prod/rel/foo/bin/foo start
    16:58:58.508 [info]  Accepting connections on port 4040

And let's connect to it and issue a request in another terminal:

    $ telnet 127.0.0.1 4040
    Trying 127.0.0.1...
    Connected to localhost.
    Escape character is '^]'.
    GET shopping foo
    Connection closed by foreign host.

Since the "shopping" bucket would be stored on `bar`, the request fails as `bar` is not available. If you go back to the terminal running `foo`, you will see:

    17:16:19.555 [error] Task #PID<0.622.0> started from #PID<0.620.0> terminating
    ** (stop) exited in: GenServer.call({KV.RouterTasks, :"bar@computer-name"}, {:start_task, [{:"foo@josemac-2", #PID<0.622.0>, #PID<0.622.0>}, [#PID<0.622.0>, #PID<0.620.0>, #PID<0.618.0>], :monitor, {KV.Router, :route, ["shopping", KV.Registry, :lookup, [KV.Registry, "shopping"]]}], :temporary, nil}, :infinity)
        ** (EXIT) no connection to bar@computer-name
        (elixir) lib/gen_server.ex:1010: GenServer.call/3
        (elixir) lib/task/supervisor.ex:454: Task.Supervisor.async/6
        (kv) lib/kv/router.ex:21: KV.Router.route/4
        (kv_server) lib/kv_server/command.ex:74: KVServer.Command.lookup/2
        (kv_server) lib/kv_server.ex:29: KVServer.serve/1
        (elixir) lib/task/supervised.ex:90: Task.Supervised.invoke_mfa/2
        (stdlib) proc_lib.erl:249: :proc_lib.init_p_do_apply/3
    Function: #Function<0.128611034/0 in KVServer.loop_acceptor/1>
        Args: []

Let's now define a release for `:bar`. One first step could be to define a release exactly like `foo` inside `mix.exs`. Additionally we will set the `cookie` option on both releases to `weknoweachother` in order for them to allow connections from each other. See the [Distributed Erlang Documentation](http://erlang.org/doc/reference_manual/distributed.html) for further information on this topic:

```elixir
releases: [
  foo: [
    version: "0.0.1",
    applications: [kv_server: :permanent, kv: :permanent],
    cookie: "weknoweachother"
  ],
  bar: [
    version: "0.0.1",
    applications: [kv_server: :permanent, kv: :permanent],
    cookie: "weknoweachother"
  ]
]
```

And now let's assemble it:

    $ MIX_ENV=prod mix release bar

And then start it:

    $ _build/prod/rel/bar/bin/bar start

If you start `bar` while `foo` is still running, you will see an error like the error below happen 5 times, before the application finally shuts down:

    17:21:57.567 [error] Task #PID<0.620.0> started from KVServer.Supervisor terminating
    ** (MatchError) no match of right hand side value: {:error, :eaddrinuse}
        (kv_server) lib/kv_server.ex:12: KVServer.accept/1
        (elixir) lib/task/supervised.ex:90: Task.Supervised.invoke_mfa/2
        (stdlib) proc_lib.erl:249: :proc_lib.init_p_do_apply/3
    Function: #Function<0.98032413/0 in KVServer.Application.start/2>
        Args: []

That's happening because the release `foo` is already listening on port `4040` and `bar` is trying to do the same! One option could be to move the `:port` configuration to the application environment, like we did for the routing table. But let's try something else. Let's make it so the `bar` release contains only the `:kv` application. So it works as a storage but it won't have a front-end. Change the `:bar` information to this:

```elixir
releases: [
  foo: [
    version: "0.0.1",
    applications: [kv_server: :permanent, kv: :permanent]
  ],
  bar: [
    version: "0.0.1",
    applications: [kv: :permanent]
  ]
]
```

And now let's assemble it once more:

    $ MIX_ENV=prod mix release bar

And finally successfully boot it:

    $ _build/prod/rel/bar/bin/bar start

If you connect to localhost once again and perform another request, now everything should work, as long as the routing table contains the correct node names. Outstanding!

With releases, we were able to "cut different slices" of our project and prepared them to run in production, all packaged into a single directory.

## Configuring releases

Releases also provide built-in hooks for configuring almost every need of the production system:

  * `config/config.exs` (and `config/prod.exs`) - provides build-time application configuration, which is executed when the release is assembled

  * `config/releases.exs` - provides runtime application configuration. It is executed every time the release boots and is further extensible via config providers

  * `rel/vm.args.eex` - a template file that is copied into every release and provides static configuration of the Erlang Virtual Machine and other runtime flags

  * `rel/env.sh.eex` and `rel/env.bat.eex` - template files that are copied into every release and executed on every command to set up environment variables, including ones specific to the VM, and the general environment

We have already explored `config/config.exs`. Now let's talk about `rel/env.sh.eex` and then `config/releases.exs` before we end this chapter.

### Operating System environment configuration

Every release contains an environment file, named `env.sh` on Unix-like systems and `env.bat` on Windows machines, that executes before the Elixir system starts. In this file, you can execute any OS-level code, such as invoke other applications, set environment variables and so on. Some of those environment variables can even configure how the release itself runs.

For instance, releases run using short-names (`--sname`). However, if you want to actually run a distributed key-value store in production, you will need multiple nodes and start the release with the `--name` option. We can achieve this by setting the `RELEASE_DISTRIBUTION` environment variable inside the `env.sh` and `env.bat` files. Mix already has a template for said files which we can customize, so let's ask Mix to copy them to our application:

    $ mix release.init
    * creating rel/vm.args.eex
    * creating rel/env.sh.eex
    * creating rel/env.bat.eex

If you open up `rel/env.sh.eex`, you will see:

```shell
#!/bin/sh

# Sets and enables heart (recommended only in daemon mode)
# if [ "$RELEASE_COMMAND" = "daemon" ] || [ "$RELEASE_COMMAND" = "daemon_iex" ]; then
#   HEART_COMMAND="$RELEASE_ROOT/bin/$RELEASE_NAME $RELEASE_COMMAND"
#   export HEART_COMMAND
#   export ELIXIR_ERL_OPTIONS="-heart"
# fi

# Set the release to work across nodes
# export RELEASE_DISTRIBUTION=name
# export RELEASE_NODE=<%= @release.name %>@127.0.0.1
```

The steps necessary to work across nodes is already commented out as an example. You can enable full distribution by uncommenting the last two lines by removing the leading  `# `.

If you are on Windows, you will have to open up `rel/env.bat.eex`, where you will find this:

```bat
@echo off
rem Set the release to work across nodes
rem set RELEASE_DISTRIBUTION=name
rem set RELEASE_NODE=<%= @release.name %>@127.0.0.1
```

Once again, uncomment the last two lines by removing the leading `rem ` to enable full distribution. And that's all!

### Runtime configuration

Another common need in releases is to compute configuration when the release runs, not when the release is assembled. The `config/config.exs` file we defined at the beginning of this chapter runs on every Mix command, when we build, test and run our application. This is great, because it provides a unified configuration for dev, test, and prod.

However, your production environments may have specific needs. For example, right now we are hardcoding the routing table, but in production, you may need to read the routing table from disk, from another service, or even reach out to your orchestration tool, like Kubernetes. This can be done by adding a `config/releases.exs`. As the name says, this file runs every time the release starts. For instance, you could do:

```elixir
import Config
{table, _} = Code.eval_file("routing_table_from_disk.exs")
config :kv, :routing_table, table
```

Or perhaps you want to make the `KVServer` port configurable, and the value for the port is only given at runtime:

```elixir
import Config
config :kv_server, :port, System.fetch_env!("PORT")
```

`config/releases.exs` files work very similar to regular `config/config.exs` files, but they may have some restrictions. You can [read the documentation](https://hexdocs.pm/mix/1.9.0-rc.0/Mix.Tasks.Release.html#module-runtime-configuration) for more information.

## Summing up

Throughout the guide, we have built a very simple distributed key-value store as an opportunity to explore many constructs like generic servers, supervisors, tasks, agents, applications and more. Not only that, we have written tests for the whole application, got familiar with ExUnit, and learned how to use the Mix build tool to accomplish a wide range of tasks.

If you are looking for a distributed key-value store to use in production, you should definitely look into [Riak](http://basho.com/products/riak-kv/), which also runs in the Erlang <abbr title="Virtual Machine">VM</abbr>. In Riak, the buckets are replicated, to avoid data loss, and instead of a router, they use [consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) to map a bucket to a node. A consistent hashing algorithm helps reduce the amount of data that needs to be migrated when new storage nodes are added to your live system.

Of course, Elixir can be used for much more than distributed key-value stores. Embedded systems, data-processing and data-ingestion, web applications, streaming systems, and others are many of the different domains Elixir excels at. We hope this guide has prepared you to explore any of those domains or any future domain you may desire to bring Elixir into.

Happy coding!
