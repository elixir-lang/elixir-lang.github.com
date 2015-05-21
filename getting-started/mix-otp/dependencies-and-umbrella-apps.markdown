---
layout: getting-started
title: Dependencies and umbrella projects
redirect_from: /getting_started/mix_otp/7.html
---

# {{ page.title }}

{% include toc.html %}

In this chapter, we will briefly discuss how to manage dependencies in Mix.

Our `kv` application is complete, so it's time to implement the server that will handle the requests we defined in the first chapter:

```
CREATE shopping
OK

PUT shopping milk 1
OK

PUT shopping eggs 3
OK

GET shopping milk
1
OK

DELETE shopping eggs
OK
```

However, instead of adding more code to the `kv` application, we are going to build the TCP server as another application that is a client of the `kv` application. Since the whole runtime and Elixir ecosystem are geared towards applications, it makes sense to break our projects into smaller applications that work together rather than building a big, monolithic app.

Before creating our new application, we must discuss how Mix handles dependencies. In practice, there are two kinds of dependencies we usually work with: internal and external dependencies. Mix supports mechanisms to work with both of them.

## External dependencies

External dependencies are the ones not tied to your business domain. For example, if you need a HTTP API for your distributed KV application, you can use the [Plug](http://github.com/elixir-lang/plug) project as an external dependency.

Installing external dependencies is simple. Most commonly, we use the [Hex Package Manager](http://hex.pm), by listing the dependency inside the deps function in our `mix.exs` file:

```elixir
def deps do
  [{:plug, "~> 0.5.0"}]
end
```

This dependency refers to the latest version of plug in the 0.5.x version series that has been pushed to Hex. This is indicated by the `~>` preceding the version number. For more information on specifying version requirements, see the [documentation for the Version module](/docs/stable/elixir/#!Version.html).

Typically, stable releases are pushed to Hex. If you want to depend on an external dependency still in development, Mix is able to manage git dependencies, too:

```elixir
def deps do
  [{:plug, git: "git://github.com/elixir-lang/plug.git"}]
end
```

You will notice that when you add a dependency to your project, Mix generates a `mix.lock` file that guarantees *repeatable builds*. The lock file must be checked in to your version control system, to guarantee that everyone who uses the project will use the same dependency versions as you.

Mix provides many tasks for working with dependencies, which can be seen in `mix help`:

```bash
$ mix help
mix deps              # List dependencies and their status
mix deps.clean        # Remove the given dependencies' files
mix deps.compile      # Compile dependencies
mix deps.get          # Get all out of date dependencies
mix deps.unlock       # Unlock the given dependencies
mix deps.update       # Update the given dependencies
```

The most common tasks are `mix deps.get` and `mix deps.update`. Once fetched, dependencies are automatically compiled for you. You can read more about deps by typing `mix help deps`, and in the [documentation for the Mix.Tasks.Deps module](/docs/stable/mix/#!Mix.Tasks.Deps.html).

## Internal dependencies

Internal dependencies are the ones that are specific to your project. They usually don't make sense outside the scope of your project/company/organization. Most of the time, you want to keep them private, whether due to technical, economic or business reasons.

If you have an internal dependency, Mix supports two methods of working with them: git repositories or umbrella projects.

For example, if you push the `kv` project to a git repository, you just need to list it in your deps code in order to use it:

```elixir
def deps do
  [{:kv, git: "git://github.com/YOUR_ACCOUNT/kv.git"}]
end
```

It doesn't matter if the git repository is public or private, Mix will be able to fetch it for you as long as you have the proper credentials.

However, using git dependencies for internal dependencies is somewhat discouraged in Elixir. Remember that the runtime and the Elixir ecosystem already provide the concept of applications. As such, we expect you to frequently break your code into applications that can be organized logically, even within a single project.

However, if you push every application as a separate project to a git repository, your projects can become very hard to maintain, because now you will have to spend a lot of time managing those git repositories rather than writing your code.

For this reason, Mix supports "umbrella projects." Umbrella projects allow you to create one project that hosts many applications and push all of them to a single git repository. That is exactly the style we are going to explore in the next sections.

What we are going to do is create a new mix project. We are going to creatively name it `kv_umbrella`, and this new project will have both the existing `kv` application and the new `kv_server` application inside. The directory structure will look like this:

    + kv_umbrella
      + apps
        + kv
        + kv_server

The interesting thing about this approach is that Mix has many conveniences for working with such projects, such as the ability to compile and test all applications inside `apps` with a single command. However, even though they are all listed together inside `apps`, they are still decoupled from each other, so you can build, test and deploy each application in isolation if you want to.

So let's get started!

## Umbrella projects

Let's start a new project using `mix new`. This new project will be named `kv_umbrella` and we need to pass the `--umbrella` option when creating it. Do not create this new project inside the existing `kv` project!

```bash
$ mix new kv_umbrella --umbrella
* creating .gitignore
* creating README.md
* creating mix.exs
* creating apps
* creating config
* creating config/config.exs
```

From the printed information, we can see far fewer files are generated. The generated `mix.exs` file is different too. Let's take a look (comments have been removed):

```elixir
defmodule KvUmbrella.Mixfile do
  use Mix.Project

  def project do
    [apps_path: "apps",
     deps: deps]
  end

  defp deps do
    []
  end
end
```

What makes this project different from the previous one is simply the `apps_path: "apps"` entry in the project definition. This means this project will act as an umbrella. Such projects do not have source files nor tests, although they can have dependencies which are only available for themselves. We'll create new application projects inside the apps directory. We call these applications "umbrella children".

Let's move inside the apps directory and start building `kv_server`. This time, we are going to pass the `--sup` flag, which will tell Mix to generate a supervision tree automatically for us, instead of building one manually as we did in previous chapters:

```bash
$ cd kv_umbrella/apps
$ mix new kv_server --module KVServer --sup
```

The generated files are similar to the ones we first generated for `kv`, with a few differences. Let's open up `mix.exs`:

```elixir
defmodule KVServer.Mixfile do
  use Mix.Project

  def project do
    [app: :kv_server,
     version: "0.0.1",
     deps_path: "../../deps",
     lockfile: "../../mix.lock",
     elixir: "~> 0.14.1-dev",
     deps: deps]
  end

  def application do
    [applications: [:logger],
     mod: {KVServer, []}]
  end

  defp deps do
    []
  end
end
```

First of all, since we generated this project inside `kv_umbrella/apps`, Mix automatically detected the umbrella structure and added two lines to the project definition:

```elixir
deps_path: "../../deps",
lockfile: "../../mix.lock",
```

Those options mean all dependencies will be checked out to `kv_umbrella/deps`, and they will share the same lock file. Those two lines are saying that if two applications in the umbrella share the same dependency, they won't be fetched twice. They'll be fetched once, and Mix will ensure that both apps are always running against the same version of their shared dependency.

The second change is in the `application` function inside `mix.exs`:

```elixir
def application do
  [applications: [:logger],
   mod: {KVServer, []}]
end
```

Because we passed the `--sup` flag, Mix automatically added `mod: {KVServer, []}`, specifying that `KVServer` is our application callback module. `KVServer` will start our application supervision tree.

In fact, let's open up `lib/kv_server.ex`:

```elixir
defmodule KVServer do
  use Application

  def start(_type, _args) do
    import Supervisor.Spec, warn: false

    children = [
      # worker(KVServer.Worker, [arg1, arg2, arg3])
    ]

    opts = [strategy: :one_for_one, name: KVServer.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

Notice that it defines the application callback function, `start/2`, and instead of defining a supervisor named `KVServer.Supervisor` that uses the `Supervisor` module, it conveniently defined the supervisor inline! You can read more about such supervisors by reading [the Supervisor module documentation](/docs/stable/elixir/#!Supervisor.html).

We can already try out our first umbrella child. We could run tests inside the `apps/kv_server` directory, but that wouldn't be much fun. Instead, go to the root of the umbrella project and run `mix test`:

```bash
$ mix test
```

And it works!

Since we want `kv_server` to eventually use the functionality we defined in `kv`, we need to add `kv` as a dependency to our application.

## In umbrella dependencies

Mix supports an easy mechanism to make one umbrella child depend on another. Open up `apps/kv_server/mix.exs` and change the `deps/0` function to the following:

```elixir
defp deps do
  [{:kv, in_umbrella: true}]
end
```

The line above makes `:kv` available as a dependency inside `:kv_server`. We can invoke the modules defined in `:kv` but it does not automatically start the `:kv` application. For that, we also need to list `:kv` as an application inside `application/0`:

```elixir
def application do
  [applications: [:logger, :kv],
   mod: {KVServer, []}]
end
```

Now Mix will guarantee the `:kv` application is started before `:kv_server` is started.

Finally, copy the `kv` application we have built so far to the `apps` directory in our new umbrella project. The final directory structure should match the structure we mentioned earlier:

    + kv_umbrella
      + apps
        + kv
        + kv_server

We now just need to modify `apps/kv/mix.exs` to contain the umbrella entries we have seen in `apps/kv_server/mix.exs`. Open up `apps/kv/mix.exs` and add to the `project` function:

```elixir
deps_path: "../../deps",
lockfile: "../../mix.lock",
```

Now you can run tests for both projects from the umbrella root with `mix test`. Sweet!

Remember that umbrella projects are a convenience to help you organize and manage your applications. Applications inside the `apps` directory are still decoupled from each other. Each application has its independent configuration, and dependencies in between them must be explicitly listed. This allows them to be developed together, but compiled, tested and deployed independently if desired.

## Summing up

In this chapter we have learned more about Mix dependencies and umbrella projects. We have decided to build an umbrella project because we consider `kv` and `kv_server` to be internal dependencies that matter only in the context of this project.

In the future, you are going to write applications and you will notice they can be easily extracted into a concise unit that can be used by different projects. In such cases, using Git or Hex dependencies is the way to go.

Here are a couple questions you can ask yourself when working with dependencies. Start with: does this application makes sense outside this project?

* If no, use an umbrella project with umbrella children.
* If yes, can this project be shared outside your company / organization?
  * If no, use a private git repository.
  * If yes, push your code to a git repository and do frequent releases using [Hex](http://hex.pm).

With our umbrella project up and running, it is time to start writing our server.
