---
layout: post
title: Building a Web Framework. Part II
author: Alexei Sholik
category: "Web dev"
excerpt: Last time we learned how to write macros that provide a useful abstraction for building a web server on top of the language. The server we built was able to serve static files and handle user's GET and POST requests. This week we're going to further extend our web framework, fix a couple of rough edges, and experiment with networking.
---

[Last time][1] we learned how to write macros that provide a useful abstraction for building a web server on top of the language. The server we built was able to serve static files and handle user's GET and POST requests.

This week we're going to further extend our web framework, fix a couple of rough edges, and experiment with networking. Specifically, we're going to

 * implement URL query parsing;
 * add a generic `handle` method;
 * write an API to simplify testing the framework;
 * examine various choice to be made when designing your own framework (not necessarily a web framework).

The code for this and the past articles is available over at [GitHub][2]. To follow along with the post, I recommend keeping the code from the first directory (_1-macros_) open in a side window. I will be explaining the new stuff off of it.

  [1]: http://elixir-lang.org/blog/2012/04/21/hello-macros/
  [2]: https://github.com/alco/web-framework


## Unexpected Requests ##

Our server can currently handle only those requests that we have explicitly coded. If we try to send it a different kind of request, it'll crash:

    iex> HelloServer.handle :oops, "/", nil
    ** (FunctionClauseError) no function clause matching: HelloServer.handle(:oops, "/", nil)

To avoid this, we'll add a catch-all default handler to _feb.ex_:

    defmacro default_handle do
      quote do
        def handle(method, path, data // "")
        def handle(method, path, data) do
          # Allow only the listed methods
          if not (method in [:get, :post, :delete]) do
            format_error(400)

          # Path should always start with a slash (/)
          elsif: not match?("/" <> _, path)
            format_error(400)

          # Otherwise, the request is assumed to be valid but the requested
          # resource cannot be found
          else:
            format_error(404)
          end
        end
      end
    end

I've also introduced a new function that automates error reporting a bit. Here's how it's implemented:

    # Return a { :error, <binary> } tuple with error description
    def format_error(code) do
      { :error, case code do
      match: 400
        "400 Bad Request"
      match: 404
        "404 Not Found"
      else:
        "503 Internal Server Error"
      end }
    end

Lastly, I've changed the `import` statement in the `__using__` macro to the following:

    import Feb
    # was
    # import Feb, only: [get: 2, post: 2]

This will allow us to add new functions and make them available to the client code automatically.

We'll add a call to the `default_handle` method at the end of our server definition in _server.ex_. This will make sure that this handler is going to be invoked only after every other clause was tried and failed to match the arguments.

Now let's test the new handler.

    $ make
    $ iex
    iex> HelloServer.handle :oops, "/"
    {:error,"400 Bad Request"}

    iex> HelloServer.handle :get, "wrong_path"
    {:error,"400 Bad Request"}

That's better.


## URL Queries ##

We'd like our server to be able to handle URL queries of the form `/search?q=donut`. Let's implement the `split_path` method that will return a tuple of the form `{ path, query }` where `query` is going to be an orddict. If the path does not contain a query, an empty orddict will be returned.

    # Return { path, query } where `query` is an orddict.
    def split_path(path_with_query) do
      case Regex.split %r/\?/, path_with_query do
      match: [ path, query ]
        { path, dict_from_query(query) }

      # No query in the path. Return an empty orddict.
      match: [ path ]
        { path, Orddict.new }
      end
    end

    # Split the query of the form `key1=value1&key2=value2...` into separate
    # key-value pairs and put them in an orddict
    defp dict_from_query(query) do
      parts = Regex.split %r/&/, query
      Enum.reduce parts, Orddict.new, fn(kvstr, dict) ->
        [ key, value ] = Regex.split %r/=/, kvstr
        Dict.put dict, key, value
      end
    end

The code is pretty straightforward. We're using regular expressions to split the string into components and then populate an empty orddict with one entry for each `key=value` pair in the query.

Let's make sure that it works:

    $ make
    $ iex
    iex> Feb.split_path "/search"
    {"/search",{Orddict.Record,[]}}

    iex> Feb.split_path "/search?q=hello&r=world"
    {"/search",{Orddict.Record,[{"q","hello"},{"r","world"}]}}

OK, so that's done. But we have no way of passing the query to the server. This is solved by adding another clause to the `get` macro that looks as follows:

    # feb.ex

    defmacro get(path, query, [do: code]) do
      quote do
        def handle(:get, unquote(path), unquote(query)) do
          unquote(code)
        end
      end
    end

With this new clause in place we can rewrite our `get` request definition in the `HelloServer` module:

    # server.ex

    get "/", query do
      search = Dict.get query, "search"
      if search do
        { :ok, "No items found for the query '#{search}'" }
      else:
        { :ok, "Hello world!" }
      end
    end

    # When we're not interested in the query, we can still write the simple
    # form.
    get "/idontcare" do
      :ok
    end


All that's left is to test the code:

    $ make
    $ iex
    iex> { path, query } = Feb.split_path "/?search=donut"
    {"/",{Orddict.Record,[{"search","donut"}]}}

    iex> HelloServer.handle :get, path, query
    {:ok,"No items found for the query 'donut'"}

    iex> HelloServer.handle :get, "/idontcare"
    :ok


## Building a Client API ##

Up until now we have been calling the `HelloServer.handle` method manually. This kind of defeats the purpose of having a useful abstraction for our web framework. Let's take a brief detour and build a client API that'll provide a more natural way for sending requests to the server. Plus, we'll run the server in a separate Erlang process so all communication with it is going to be performed via message passing. The exact messaging protocol is what we'll hide behind a few methods in our API (one for each HTTP verb).

Before we do that, let's implement the messaging part first. Remember that at the very beginning we have defined a `start` method. Now it's time to review it and put it to use. Here's what the new implementation looks like:

    # feb.ex

    def start(module) do
      IO.puts "Executing Feb.start"
      pid = spawn __MODULE__, :init, [module]
      Process.register module, pid
      pid
    end

    def init(module) do
      msg_loop module
    end


We're spawning a new process and register it with the module name (`HelloServer` in our case). The `init` method is called when the process is spawned. This method passes control to the message loop which we're going to look at next.

    defp msg_loop(module) do
      receive do
      match: { from, { :get, path_with_query } }
        { path, query } = split_path(path_with_query)
        from <- module.handle(:get, path, query)
        msg_loop module

This handles the GET request. The routine is as follows: process the message, invoked the appropriate method (we did this step manually before), send the return value to the client and recurse back into the message loop waiting for a new message to come in.

The code for POST and DELETE requests looks similar:

      match: { from, { :post, path, body } }
        from <- module.handle(:post, path, body)
        msg_loop module

      match: { from, { :delete, path } }
        from <- module.handle(:delete, path)
        msg_loop module
      end
    end  # defp msg_loop

The only difference between the three is that 1) we allow queries to be included in the path only for the GET method and 2) the POST method requires a request body even if its empty. With those methods in place, we can test our server process.

    $ make
    $ iex
    iex> HelloServer.start
    Executing Feb.start
    <0.36.0>

    iex> HelloServer <- { Process.self(), { :get, "/?search=empty" } }
    {<0.35.0>,{:get,"/?search=empty"}}

    iex> receive do
    ...> match: x
    ...> x
    ...> end
    {:ok,"No items found for the query 'empty'"}

It works! Now we can start abstracting away the implementation details of our messaging protocol. Let's first define a general-purpose `call` method that will send the message and wait for a reply. We'll put it inside the `Feb.API` submodule by adding the following code at the bottom of the `Feb` module definition:

    defmodule API do
      # Client API

      def call(target, msg) do
        target <- { Process.self(), msg }
        receive do
        match: x
          x
        after: 1000
          :timeout
        end
      end
    end

The code is straightforward enough. It sends the message, waits for a reply and returns it back to the caller.

    $ make
    $ iex
    iex> HelloServer.start
    Executing Feb.start
    <0.36.0>

    iex> Feb.API.call HelloServer, { :post, "/", "my data" }
    {:ok,"You're posted!\nYour data: \"my data\""}

The last touch is to add specific methods representing the HTTP verbs our framework supports, namely GET, POST, and DELETE.

    # Inside Feb.API

    def get(target, path_with_query) do
      call target, { :get, path_with_query }
    end

    def post(target, path, body // "") do
      call target, { :post, path, body }
    end

    def delete(target, path) do
      call target, { :delete, path }
    end

Now we can run our final test.

    $ make
    $ iex
    iex> HelloServer.start
    Executing Feb.start
    <0.36.0>

    iex> Feb.API.get HelloServer, "/?search=none"
    {:ok,"No items found for the query 'none'"}

    iex> Feb.API.post HelloServer, "/"
    {:ok,"You're posted!\nYour data: \"\""}

    iex> Feb.API.delete HelloServer, "/something"
    {:error,"404 Not Found"}


## Bonus: Generic Handle ##

Before we finish, let's add one new piece of sugar to our framework by allowing the users to write one method that will handle several HTTP verbs. It can be useful to define various interactions with a single path specification. For this example, we'll build a basic NoSQL store shared among all clients. Here's what it's going to look like:

    handle "/kvstore" do
    post:
      query = parse_query _body
      Enum.each query, fn({k, v}) ->
        Erlang.ets.insert :simple_table, {k, v}
      end
      :ok

    get:
      key = Dict.get _query, "key"
      if key do
        [val] = Erlang.ets.lookup :simple_table, key
        { :ok, val }
      else:
        { :error, 404 }
      end

    delete:
      key = Dict.get _query, "key"
      if key do
        Erlang.ets.delete :simple_table, key
        :ok
      else:
        { :error, 404 }
      end
    end


## Conclusion ##

Let's recap what we've done and learned:

 * we've finished the web framework API;
 * we've built an API for clients that allows us to test the server easily;
 * we've built a messaging layer

Next time, we'll look at how to replace the current messaging layer with real TCP networking and how to handle multiple independent connections. After that, we'll add support for the HTTP protocol. At that point we'll have everything ready to build a real website and put it up on Heroku for everyone to try it out. See you next time!

---

This concludes the second part in the series. Don't forget to grab the code [from GitHub][2]. If you have any questions or corrections, send a message to the [mailing list][3] or join the the **#elixir-lang** channel on **irc.freenode.net**.

See you there.

  [3]: http://groups.google.com/group/elixir-lang-core
