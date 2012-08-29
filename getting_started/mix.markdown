---
layout: getting_started
title: Mix
---

# Mix

Elixir ships with a few applications to make building and deploying projects with Elixir easier and Mix is certainly their backbone.

Mix is a build tool that provides tasks for creating, compiling, testing (and soon deploying) Elixir projects. Mix is inspired by the [Leiningen](https://github.com/technomancy/leiningen) build tool for Clojure and was written by one of its contributors.

In this chapter, you will learn how to create projects using `mix`, install dependencies and create your own tasks.

## 1 Getting started

In order to start your first project, simply use the `mix new` command passing the path to your project. For now, we will create an application called `my_project` in the current directory:

    mix new ./my_project

Mix will create a directory named `my_project` with few files in it:

    .gitignore
    README.md
    mix.exs
    lib/my_project.ex
    test/test_helper.exs
    test/my_project_test.exs

Let's take a brief look at some of these.

> Mix is an Elixir executable. This means that in order to run `mix`, you need to have elixir's executable in your PATH. If not, you can run it by passing the script as argument to elixir:
>
>     bin/elixir bin/mix new ./my_project
>
> Note that you can also execute any script in your PATH from Elixir via the -S option:
>
>     bin/elixir -S mix new ./my_project
>
> When using -S, elixir finds the script wherever it is in your PATH and executes it.

### 1.1 mix.exs

This is the file with your projects configuration. It looks like this:

{% highlight ruby %}
defmodule MyProject.Mixfile do
  use Mix.Project

  def project do
    [ app: :my_project,
      version: "0.0.1",
      deps: deps ]
  end

  # Configuration for the OTP application
  def application do
    []
  end

  # Returns the list of dependencies in the format:
  # { :foobar, "0.1", git: "https://github.com/elixir-lang/foobar.git" }
  defp deps do
    []
  end
end
{% endhighlight %}

Our `mix.exs` is quite straight-forward. It defines two functions, `project` which should return the project configuration, for example, where to find the source files, the application name and version. And another function named `application` which allow us to generate an application according to the Open Telecom Platform (OTP) that ships with Erlang. We will talk more about these later.

### 1.2 lib/my_project.ex

This file simply contains the definition of our project main module with a `start` function:

{% highlight ruby %}
defmodule MyProject do
  def start do
    :ok = :application.start(:my_project)
  end
end
{% endhighlight %}


The `start` function invokes the erlang module `application` and tells it to start our application.

### 1.3 test/my_project_test.exs

This file contains a stub test case for our project:

{% highlight ruby %}
Code.require_file "../test_helper", __FILE__

defmodule MyProjectTest do
  use ExUnit.Case

  test "the truth" do
    assert true
  end
end
{% endhighlight %}

It is important to note a couple things:

1) Notice the file is an Elixir script file (`.exs`). This is convenient because we don't need to compile test files before running them;

2) The first line in our test is simply requiring the `test_helper` file in the same directory as the current file. As we are going to see, the `test/test_helper.exs` file is responsible for starting the test framework;

3) Then we define a test module named `MyProjectTest`, using `ExUnit.Case` to inject default behavior and define a simple test. You can learn more about the test framework in the [ExUnit](/getting_started/ex_unit.html) chapter;

Since this file is a script file (`.exs`) and it also requires `test_helper.exs`, responsible for setting up the test framework, we can execute this file directly from the command line, which is very useful when you want to run a specific test and not the whole test suite, try it:

    $ elixir -pa ebin test/my_project_test.exs

### 1.4 test/test_helper.exs

The last file we are going to check is the `test_helper.exs`, which simply loads our application and sets up the test framework:

{% highlight ruby %}
MyProject.start
ExUnit.start
{% endhighlight %}

And that is it, with our project created. We are ready to move on!

## 2 Exploring

Now that we created our new project, what can we do with it? In order to check the commands available to us, just run the task `help`:

    $ mix help

It will print all the tasks available. You can get further information by invoking `mix help TASK`.

Play around with the available tasks, like `mix compile` and `mix test`, and execute them in your project to check how they work.

## 3 Compilation

Mix can compile our project for us. The default configurations uses `lib/` for source files and `ebin/` for compiled beam files, you don't even have to provide any compilation-specific setup but if you must, some options are available. For instance, if you want to put your compiled files in another directory besides `ebin`, simply set in `:compile_path` in your `mix.exs` file:

{% highlight ruby %}
def project do
  [compile_path: "ebin"]
end
{% endhighlight %}

In general, Mix tries to be smart and compile only when necessary.

You can also note that, after you compile for the first time, Mix generates an `my_project.app` file inside your `ebin` directory. This file specifies an Erlang application and it holds information about your application, for example, what are its dependencies, which modules it defines and so forth. In our `MyProject.start` function, when we call `:application.start(:my_project)`, Erlang will load the `my_project.app` file and process it. For instance, if there are any dependencies missing, it will let us now.

### 3.1 Running the application

Generally, the application starts by calling `MyProject.start` function.
It's the entry point to your application, so besides the call to
`:application.start(:my_project)`, you might want to do actual app job
here.

There are a few ways to start an application. You can use the `mix run` task or run `mix iex` to start an Elixir interactive shell and then type `MyProject.start` to play with exported application functions and more.

## 4 Tasks

In Mix, a task is simply an Elixir module inside the `Mix.Tasks` namespace and a `run/1` function. For example, the `compile` task is a module named `Mix.Tasks.Compile`.

Here is a simple example task:

{% highlight ruby %}
defmodule Mix.Tasks.Hello do
  use Mix.Task

  @shortdoc "This is short documentation, see"

  @moduledoc """
  A test task.
  """
  def run(_) do
    IO.puts "Hello, World!"
  end
end
{% endhighlight %}

This defines a task called `hello`. In order to make it a task, it defines a `run` function that takes a single argument that will be a list of binary strings which are the arguments that were passed to the task on the command line or from another task calling this one.

When you invoke `mix hello`, this task will run and print `Hello, World!`. Mix uses its first argument to lookup the task module and execute its `run` function.

You're probably wondering why we have a `@moduledoc` and `@shortdoc`. Both are used by the `help` task for listing tasks and providing documentation of them. The former is used when `mix help TASK` is invoked, the latter in the general listing with `mix help`.

Besides those two, there is also `@hidden` attribute that, when set to true, marks the task as hidden so it does not show up on `mix help Task`. Any task without `@shortdoc` also won't show up.

### 4.1 Common API

When writing tasks, there are some common mix functionality we would like to access. There is a gist:

* `Mix.project` - Returns the project configuration under the function `project`; Notice this function returns an empty configuration if no `mix.exs` file exists in the current directory, this allows many mix functions to work even if a `mix.exs` project is not defined;

* `Mix.Project.current` - Access the module for the current project, this is useful in case you want to access special functions in the project. It raises an exception if no project is defined;

* `Mix.shell` - The shell is a simple abstraction for doing IO in Mix. Such abstractions make it easy to test existing mix tasks. In the future, the shell will provide conveniences for colored output and getting user input;

* `Mix.Task.run(task, args)` - This is how you invoke a task from another task in Mix; Notice that if the task was already invoked, it works as no-op;

There is more to the Mix API, so feel free to [check the documentation](/docs/stable/Mix.html), with special attention to [`Mix.Task`](/docs/stable/Mix.Task.html) and [`Mix.Project`](/docs/stable/Mix.Project.html).

### 4.2 Namespaced Tasks

While tasks are simple, they can be used to accomplish complex things. Since they are just Elixir code, anything you can do in normal Elixir you can do in Mix tasks. You can distribute tasks however you want just like normal libraries and thus they can be reused in many projects.

So, what do you do when you have a whole bunch of related tasks? If you name them all like `foo`, `bar`, `baz`, etc, eventually you'll end up with conflicts with other people's tasks. To prevent this, Mix allows you to namespace tasks.

Let's assume you have a bunch of tasks for working with Riak.

{% highlight ruby %}
defmodule Mix.Tasks.Riak do
  defmodule Dostuff do
    ...
  end

  defmodule Dootherstuff do
    ...
  end
end
{% endhighlight %}

Now you'll have two different tasks under the modules `Mix.Tasks.Riak.Dostuff` and `Mix.Tasks.Riak.Dootherstuff` respectively. You can invoke these tasks like so: `mix mongodb.dostuff` and `mix mongodb.dootherstuff`. Pretty cool, huh?

You should use this feature when you have a bunch of related tasks that would be unwieldly if named completely independently of each other. If you have a few unrelated tasks, go ahead and name them however you like.

## 5 Dependencies

Mix is also able to manage git (so far) dependencies. Dependencies should be listed in project settings, as follow:

{% highlight ruby %}
def project do
  [ app: :my_project,
    version: "0.0.1",
    deps: deps ]
end

defp deps do
  [ { :some_project, "0.3.0", git: "https://github.com/some_project/other.git" },
    { :another_project, "1.0.2", git: "https://github.com/another/main.git" } ]
end
{% endhighlight %}

**Note:** Although not required, it is common to split dependencies into their own function;

### 5.1 Source Code Management (SCM)

In the example above, we have used `git` to specify our dependency.  Mix was designed in a way it can support multiple SCM tools, by default it ships with `:git` and `:raw`. The most common options are:

* `:git` - the dependency is a git repository that is retrieved and updated by Mix;
* `:raw` - the dependency is simply a raw path in the filesystem;
* `:compile` - how to compile the dependency, more information in the next section;

Each SCM may support custom options. `:git` supports the following:

* `:ref` - an optional reference (a commit) to checkout the git repository;
* `:tag` - an optional tag to checkout the git repository;
* `:branch` - an optional branch to checkout the git repository;
* `:submodules` - when true, initializes submodules recursively in the dependency;

### 5.2 Compiling dependencies

In order to compile a dependency, Mix looks into the repository for the best way to proceed. If the dependency contains one of the files below, it will proceed as follows:

1. `mix.exs` - compiles the dependency directly with Mix;
2. `rebar.config` or `rebar.config.script` - compiles using `rebar compile deps_dir=DEPS`, where `DEPS` is the directory where Mix install by default the project dependencies;
3. `Makefile` - simply invokes `make`

If the dependency does not contain any of the above, you can specify a command directly with the `:compile` option

      compile: "./configure && make"

You could also pass an atom to `:compile` and, in such cases, a function with the name of the atom will be invoked in your current project with the app name as argument, allowing you to customize its compilation:

      def project do
        [
          deps: [
            { :some_project, "0.3.0",
              git: "https://github.com/some_project/other.git", compile: :using_foo }
          ]
        ]
      end

      def using_foo(app) do
        # ...
      end

Finally, if `:noop` is given to `:compile`, nothing is done.

### 5.3 Repeatability

An important feature in any dependency management tool is repeatability. For this reason when you first get your dependencies, Mix will create a file called `mix.lock` that contains in which reference each dependency is checked out.

When another developer gets a copy of the same project, Mix will checkout exactly the same references, ensuring other developers can "repeat" the same setup.

Locks are automatically updated when `deps.update` is called and can be removed with `deps.unlock`.

### 5.4 Tasks

Elixir has many tasks to manage such dependencies:

* `mix deps` - List all dependencies and their status;
* `mix deps.get` - Get all unavailable dependencies;
* `mix deps.compile` - Compile dependencies;
* `mix deps.update` - Update dependencies;
* `mix deps.clean` - Remove dependencies files;
* `mix deps.unlock` - Unlock the given dependencies;

Use `mix help` to get more information.

## 6 Local tasks

Elixir also ships with the ability to manage local tasks. Local tasks can be installed from any URL and are available from anywhere within Elixir:

    $ mix local.install http://elixir-lang/hello.beam

If everything works as expected, the task will be installed on your machine and you can then successfully invoke it:

    $ mix hello

You can use `mix local` to show all available local tasks and their path. Removing a task is as easy as:

    $ mix local.uninstall hello

## 7 Do

In some situations, it is desired to execute more than one task at once. For this purpose, Elixir also ships with a `do` task that simply executes all the given commands separated by comma:

    $ mix do help compile, compile --list

For instance, the command above will show help information for the compile task and then print the list of available compilers.

## 8 OptionParser

Although not a Mix feature, Elixir ships with an `OptionParser` which is quite useful when creating mix tasks that accepts options. The `OptionParser` receives the argv and returns a tuple with parsed options and the remaining arguments:


    OptionParser.parse(["--debug"])
    #=> { [debug: true], [] }

    OptionParser.parse(["--source", "lib"])
    #=> { [source: "lib"], [] }

    OptionParser.parse(["--source", "lib", "test/enum_test.exs", "--verbose"])
    #=> { [source: "lib", verbose: true], ["test/enum_test.exs"] }

Check [`OptionParser`](/docs/stable/OptionParser.html) documentation for more information.

## 9 Lots To Do

Mix is still a work in progress. Feel free to visit [our issues tracker](https://github.com/elixir-lang/elixir/issues) to add issues for anything you'd like to see in Mix and feel free to contribute.
