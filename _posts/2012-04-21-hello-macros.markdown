---
layout: post
title: Building a Web Framework. Part I
subtitle: Hello Macros
author: Alexei Sholik
category: "Web dev"
excerpt: Since we haven't seen much new stuff in the Elixir land this week, I've decided to do something a little different. We'll build our own web framework to get a feel of the Elixir power. In this first part we'll take a closer look at macros and we'll see how they can be useful when it comes to building a friendly syntax for our users.
---
Since we haven't seen much new stuff in the Elixir land this week, I've decided to do something a little different. We'll build our own web framework to get a feel of the Elixir power. In this first part we'll take a closer look at macros and we'll see how they can be useful when it comes to building a friendly syntax for our users.

Here's an example of what we are aiming at:

    defmodule HelloServer do
      use Feb, root: "assets"

      get "/" do
        { :ok, "Hello world!" }
      end

      get "/demo", file: "demo.html"

      post "/" do
        { :ok, "You're posted!\nYour data: #{inspect _data}" }
      end
    end

## The Foundation ##

To keep this post short and simple, we won't cover every single aspect of web framework development right away. Instead, we'll first focus on one specific task — defining a domain specific language (DSL) using Elixir macros. Let's start by stepping through the code above, one piece at a time.

You might remember from the [Getting Started guide][1] that `use` is just a syntactic sugar that expands into a call to the `__using__` macro. In our case, the expansion will look like this

    require Feb
    Feb.__using__(__MODULE, [root: "assets"])

Let's forget about the `root` option for now, we'll deal with it later. Here's how our `__using__` macro is going to be defined:

    defmodule Feb do
      defmacro __using__(module, _opts) do
        quote do
          import Feb, only: [get: 2, post: 2]

          def start do
            Feb.start unquote(module)
          end
        end
      end
    end

One important thing to understand here is that this macro is called inside the module which invokes the `use` directive (**HelloServer** in our case). When the macro is called, its return value is then evaluated inside the calling module. Thus, our **HelloServer** ends up with a definition for the `start` method which will in turn call `Feb.start`. Too see this in action, let's first define the `start` method in **Feb**:

    def start(_) do
      IO.puts "Executing Feb.start"
    end

And here's the code for our **HelloServer** so far:

    defmodule HelloServer do
      use Feb
    end

Now let's try this out in the shell. I'm using a Makefile to simplify the compilation-related tasks. You can grab a copy from the project's [GitHub repo][2]. Notice also how the project directory is organized.

    $ make
    $ elixir -e 'HelloServer.start'
    Executing Feb.start

Everything is working as expected. Now let's move to the fun part.

  [1]: http://elixir-lang.org/getting_started/6.html
  [2]: https://github.com/alco/web-framework/blob/master/1-macros/Makefile

## Writing Method Macros ##

Let's look at the first `get` definition and think a bit about its meaning.

    get "/" do
      { :ok, "Hello world!" }
    end

The important thing to know about Elixir definitions is that they are executable. The Elixir compiler does not compile the code in the strict sense of the word, it is executing the code. So when you put `IO.puts "Hello"` inside a module definition, you'll see `Hello` printed in the shell when the code is compiled.

So, in this case, it's just a call to the `get` macro defined in **Feb**. In fact, we could write it as

    Feb.get("/", do: { :ok, "Hello world!" })

and would be exactly the same thing. The reason we are allowed to omit the `Feb.` part is because we have imported the `get` macro earlier, see the definition of `__using__`.

OK, so now that when we understand what's actually going on, let's look at the definition:

    defmacro get(path, [do: code]) do
      quote do
        def handle(:get, unquote(path), _data) do
          unquote(code)
        end
      end
    end

Our `get` macro accepts two arguments, the second one is pattern-matched to extract the block of code between `do` and `end`. The macro produces a definition of the `handle` method with three arguments. The `_data` argument is not used here, it will be used in the `post` method later. So, basically, instead of calling `get` we could write the following definition in **HelloServer** to achieve the same effect:

    def handle(:get, "/", _data) do
      { :ok, "Hello world!" }
    end

That's all there is to it. We can check this in the shell.

    $ make
    $ iex
    iex> HelloServer.handle :get, "/", nil
    {:ok,"Hello world!"}

The code for the `post` macro is pretty straightforward as well:

    defmacro post(path, [do: code]) do
      quote hygiene: false do
        def handle(:post, unquote(path), _data) do
          unquote(code)
        end
      end
    end

One new thing here is `hygiene: false`. What this does is it allows us to define variables that will be accessible by the caller. We do this here so that we can then reference the `_data` variable in our **HelloServer** implementation:

    post "/" do
      { :ok, "You're posted!\nYour data: #{inspect _data}" }
    end

Check that it works as expected:

    $ make
    $ iex
    iex> HelloServer.handle :post, "/", "abc"
    {:ok,"You're posted!\nYour data: \"abc\""}

Good. We're almost done with the basics. I haven't covered the second `get` definition yet. Let's recall what it looked like:

    get "/demo", file: "demo.html"

By using this method we're letting the framework know that we want to send the contents of the _demo.html_ file back to the client. In order to support this second form we need to define another clause for our `get` macro:

    defmacro get(path, [file: bin]) when is_binary(bin) do
      quote do
        def handle(:get, unquote(path), _data) do
          full_path = File.join([static_root(), unquote(bin)])
          case File.read(full_path) do
          match: { :ok, data }
            { :ok, data }
          else:
            { :error, "404 Not Found" }
          end
        end
      end
    end

Having written the code for reading from a file in the framework, we free our users from the need to do so themselves.

## Wrapping Up ##

I haven't yet provided the definition for `static_root`, let me fix this. It has to do with the `root` option mentioned at the beginning of the post. Remember what our first invocation of `use` looked liked

    # In module HelloServer
    use Feb, root: "assets"

The `[root: "assets"]` Keyword is what ends up in the `_opts` argument of our `__using__` macro. So let's rewrite that macro to include the definition for the `static_root` method.

    # In module Feb
    defmacro __using__(module, opts) do
      root_val = Keyword.get(opts, :root, ".")

      quote do
        import Feb, only: [get: 2, post: 2]

        def start do
          Feb.start unquote(module)
        end

        defp static_root, do: unquote(root_val)
      end
    end

We read the value of the `root` key from the `opts` Keyword. If it's nil, the current directory becomes the root.

The post is already getting quite long, so let's wrap up and do the final test drive to make sure everything works as expected.

    $ make
    $ iex
    iex> import HelloServer
    []
    iex> handle :get, "/", nil
    {:ok,"Hello world!"}
    iex> handle :post, "/", :data
    {:ok,"You're posted!\nYour data: :data"}
    iex> handle :get, "/demo", nil
    {:error,"404 Not Found"}

Oops, looks like I've forgotten to create the _demo.html_ file. Let's do this real quick. Create the file in the _assets_ directory and paste the following contents into it:

    <html>
      <head>
        <title>Demo</title>
      </head>
      <body>
        <h1>Hello world!</h1>
      </body>
    </html>

Now let's try that again:

    iex> handle :get, "/demo", nil
    {:ok,"<html>\n<head>\n  <title>Demo</title>\n</head>\n<body>\n  <h1>Hello world!</h1>\n</body>\n</html>\n\n\n"}

Awesome! This concludes the first part in the series. Don't forget to grab the code [from GitHub][3].If you have any questions or corrections, send a message to the [mailing list][4] or stop by the **#elixir-lang** channel on **irc.freenode.net**.

See you there.

  [3]: https://github.com/alco/web-framework/tree/master/1-macros
  [4]: http://groups.google.com/group/elixir-lang-core
