---
layout: post
title: Building a Web Framework. Part II
author: Alexei Sholik
category: "Web dev"
excerpt: Last time we learned how to write macros that provide a useful abstraction for building a web server on top of the language. The server we built was able to serve static files and handle user's GET and POST requests. This week we're going to further extend our web framework, fix a couple of rough edges, and experiment with networking.
---

[Last time][1] we learned how to write macros that provide a useful abstraction on top of the language which we used for building a web server. The server we built was able to serve static files and handle user's GET and POST requests. Here's what it looked like:

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

If you missed the previous post, I encourage you to [go back][1] to it and make sure you understand the concepts explained there.

In this post we're going to fix a couple of rough edges and further extend our web framework. Specifically, we're going to implement URL query parsing and add a generic `multi_handle` macro that will complete our syntactic abstraction. From that point on we'll start looking at how to add networking to the framework to eventually be able to build a real website. This is what the code for our `HelloServer` is going to turn into by the end of this post:

    defmodule HelloServer do
      use Feb, root: "assets"

      get "/" do
        { :ok, "Hello world!" }
      end

      get "/demo", file: "demo.html"

      post "/" do
        { :ok, "You're posted!\nYour data: #{inspect _data}" }
      end

      ## New stuff below this line ##

      multi_handle "/kvstore" do
        :post ->
          IO.puts "Got a POST request with data: #{inspect _data}"
          :ok

        :get ->
          IO.puts "Got a GET request with query: #{inspect _query}"
          :ok
      end

      get "/search", query do
        search = Dict.get query, "q"
        if search do
          { :ok, "No items found for the query '#{search}'" }
        else
          { :ok, "No query" }
        end
      end
    end

The entire source code for this and the past articles is available over at [GitHub][2]. To recap, we have two files in the _src_ directory: _feb.ex_ which contains the code for our `Feb` framework and _server.ex_ which is a simple server implementation (named `HelloServer`) based on the framework. To follow along with the post, I recommend keeping the code from the _1-macros_ directory open in a side window. I will be explaining the new stuff based on the code we have seen so far.

  [1]: http://elixir-lang.org/blog/2012/04/21/hello-macros/
  [2]: https://github.com/alco/web-framework


## Unexpected Requests ##

Our server can currently handle only those requests that are explicitly coded. If we try to send it a different kind of request, it'll crash:

    iex> HelloServer.handle :oops, "/", nil
    ** (FunctionClauseError) no function clause matching: HelloServer.handle(:oops, "/", nil)

To avoid this, we'll add a catch-all default handler to _feb.ex_:

    defmacro default_handle(_) do
      quote do
        def handle(method, path, data // "")
        def handle(method, path, data) do
          cond do
            # Allow only the listed methods
            not (method in [:get, :post]) -> format_error(400)
            
            # Path should always start with a slash (/)
            not match?("/" <> _, path) -> format_error(400)
            
            # Otherwise, the request is assumed to be valid but the requested
            # resource cannot be found
            _ -> format_error(404)
        end
      end
    end

I'll explain the ignored argument to this macro shortly. I've also introduced a new function that automates error reporting a bit. Here's how it's implemented in _feb.ex_:

    # Return a { :error, <binary> } tuple with error description
    def format_error(code) do
      { :error, case code do
        400 -> "400 Bad Request"
        404 -> "404 Not Found"
        _   -> "503 Internal Server Error"
      end }
    end

Lastly, I've changed the `import` statement in the `__using__` macro (again in _feb.ex_) to the following one:

    import Feb
    # was
    # import Feb, only: [get: 2, post: 2]

This will allow us to add new functions and macros and make them available to the client code automatically.

To include the `default_handle` function in `HelloServer` we can add a call to it at the end of the module definition. But there is a better way, an automatic one. Elixir provides the function `Module.add_compile_callback/1` which is exactly what we need to set up our default handler and ensure that it is going to be invoked only after every other clause was tried and failed to match the arguments.

We'll add the following line at the beginning the `__using__` macro definition in _feb.ex_:

    defmacro __using__(module, opts) do
      Module.add_compile_callback module, __MODULE__, :default_handle

Elixir will call the `default_handle` macro as if it were placed right at the end of `HelloServer` definition and it will pass the module name as an argument (which we're not using here, so we're simply ignoring it).

Now let's test the new handler.

    $ make
    $ iex
    iex> HelloServer.handle :oops, "/"
    {:error,"400 Bad Request"}

    iex> HelloServer.handle :get, "wrong_path"
    {:error,"400 Bad Request"}

    iex> HelloServer.handle :get, "/404"
    {:error,"404 Not Found"}

That's better.


## Generic Handle ##

Let's add one more piece of sugar to our framework by allowing the users to write one function that will handle several HTTP methods, useful for defining various interactions with a single path spec. For instance:

    multi_handle "/kvstore" do
      :post ->
        IO.puts "Got a POST request with data: #{_data}"
        :ok
      :get ->
        IO.puts "Got a GET request with query: #{_query}"
        :ok
    end

You can see how this approach allows us to express the fact that "/kvstore" provides some kind of service with support for multiple methods. This skeleton could be used to build a REST API, for example. This time around we'll be using implicit variables for POST data and GET query.

Let's think for a moment what the `multi_handle` macro should expand to. So far we've been expanding our `post` and `get` macros into one `handle` function that uses pattern-matching to dispatch to the appropriate handler based on the incoming request. There's no reason not to use the same approach for `multi_handle`. So here's what its implementation looks like:

    defmacro multi_handle(path, [do: { :"->", _line, blocks }]) do
      # Iterate over each block in `blocks` and
      # produce a separate `handle` clause for it
      Enum.map blocks, fn ->
        { [:get], code } ->
          quote hygiene: false do
            def handle(:get, unquote(path), _query) do
              unquote(code)
            end
          end
        { [:post], code } ->
          quote hygiene: false do
            def handle(:post, unquote(path), _data) do
              unquote(code)
            end
          end
      end
    end

When the macro is called, we receive all clauses under the `do` key with each HTTP verb and its implementation inside the syntax node `->`, in the order they are specified. Each clause is a tuple with two elements, the first one is a list of parameters given on the left side and the second one is the implementation, for example:

    { :"->", line, [{[:get], <user code>}, {[:post], <user code>}] }

In our `multi_handle` macro signature, we pattern match against the expression above and get a list with the blocks of code. Then we loop through this list emitting a function definition with the corresponding arguments. The code for each of the code blocks is similar to the GET and POST handlers we have defined earlier.

Finally, let's test it in `iex`:

    $ make
    $ iex
    iex> import HelloServer
    []

    iex> handle :get, "/kvstore"
    Got a GET request with query: ""
    :ok

    iex> handle :post, "/kvstore"
    Got a POST request with data: ""
    :ok

    iex> handle :post, "/kvstore", "secret"
    Got a POST request with data: "secret"
    :ok

So far so good. Now let's add the ability to get the query from a URL.


## URL Queries ##

We'd like our server to be able to handle queries of the form `/search?q=donut`. The `URI` module which ships with Elixir has the right tools for the task: `parse` and `decode_query`. The first one parses a URI and stores it in a `URI.Info` record. The second one accepts a query string and returns a dict.

We'll implement a `split_path` function in `Feb` that will return a tuple of the form `{ path, query }` where `query` is going to be an orddict. If the path does not contain a query, an empty orddict will be returned.

    # Return { path, query } where `query` is an orddict.
    def split_path(path_with_query) do
      uri_info = URI.parse path_with_query
      { uri_info.path, URI.decode_query(uri_info.query || "") }
    end

The code is pretty straightforward. Let's make sure that it works:

    $ make
    $ iex
    iex> Feb.split_path "/search"
    {"/search",{Orddict.Record,[]}}

    iex> Feb.split_path "/search?q=hello&find=chuck%20norris"
    {"/search",{Orddict.Record,[{"find","chuck norris"},{"q","hello"}]}}

OK, so that's done. But we have no way of passing the query to the server. This is solved by adding another clause to the `get` macro as follows:

    # feb.ex

    # A 2-argument handler that also receives a query along with the path
    defmacro get(path, query, [do: code]) do
      quote do
        def handle(:get, unquote(path), unquote(query)) do
          unquote(code)
        end
      end
    end

The only difference between this handler and the basic query-less GET handler is that we include the `query` argument provided by the user in the generated function definition. Remember that in our [POST handler](https://github.com/alco/web-framework/blob/master/1-macros/src/feb.ex#L49) we used a `quote` form with hygiene turned off in order to define an implicit `_data` variable. Our GET handlers could also receive such implicit argument if we turned the hygiene off for them. The reason I've chosen to handle the query explicitly in this case is to show you that there are multiple options available. You may choose whichever you like most.

With this new clause in place we can add another `get` request definition in the `HelloServer` module:

    # server.ex

    get "/search", query do
      search = Dict.get query, "q"
      if search do
        { :ok, "No items found for the query '#{search}'" }
      else
        { :ok, "No query" }
      end
    end

Let's take a step back and look again at the definition for this `get` macro in _feb.ex_. It takes its second argument (the `query`) and puts it in place of the third argument in the definition of `handle`. The reason we're unquoting it (instead of simply writing `query`) is to allow the user to choose an arbitrary name for this argument. So, for instance, the following definition in `HelloServer` will work the same way:

    get "/search", my_query do
      # the query dict is now stored in `my_query`
      IO.inspect my_query
    end

All that's left is to test the code:

    $ make
    $ iex
    iex> { path, query } = Feb.split_path "/search?q=donut"
    {"/search",{Orddict.Record,[{"q","donut"}]}}

    iex> import HelloServer
    []

    iex> handle :get, path, query
    {:ok,"No items found for the query 'donut'"}

    iex> handle :get, "/search", Orddict.new
    {:ok,"No query"}

    # Let's also test our generic handler with a query
    iex> handle :get, "/kvstore", URI.decode_query("key=value")
    Got a GET request with query: {Orddict.Record,[{"key","value"}]}
    :ok

Great! With this we have completed the implementation of our simplistic DSL. Let's wrap up for this week and do a quick review of what we have learned.


## Conclusion ##

By this time you know how to use macros to your advantage by defining appropriate abstractions that allow writing code that's easy to grasp. Another benefit of this approach is that it hides implementation details so that they can be changed without touching the application-level code. We'll see an example of this in a future post.

Next time, we'll implement a basic networking layer for our framework. It will serve as a basis for testing and adding support for the real HTTP protocol later on.

---

This concludes the second part in the series. Don't forget to grab the code [from GitHub][2]. I'd like to thank [@rafaelfranca][4] and [@josevalim][5] for their valuable suggestions. If you have any questions or corrections, send a message to the [mailing list][3] or join the the **#elixir-lang** channel on **irc.freenode.net**.

See you there.

  [3]: http://groups.google.com/group/elixir-lang-talk
  [4]: https://github.com/rafaelfranca
  [5]: https://github.com/josevalim
