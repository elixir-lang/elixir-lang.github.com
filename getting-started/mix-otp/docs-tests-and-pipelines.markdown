---
layout: getting-started
title: 9 Docs, tests and pipelines
guide: 9
redirect_from: "/getting_started/mix_otp/9.html"
---

# {{ page.title }}

{% include toc.html %}

In this chapter, we will implement the code that parses the commands we described in the first chapter:

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

After the parsing is done, we will update our server to dispatch the parsed commands to the `:kv` application we built previously.

## 9.1 Doctests

On the language homepage, we mention that Elixir makes documentation a first-class citizen in the language. We have explored this concept many times throughout this guide, be it via `mix help` or by typing `h Enum` or another module in an IEx console.

In this section, we will implement the parse functionality using doctests, which allows us to write tests directly from our documentation. This helps us provide documentation with accurate code samples.

Let's create our command parser at `lib/kv_server/command.ex` and start with the doctest:

```elixir
defmodule KVServer.Command do
  @doc ~S"""
  Parses the given `line` into a command.

  ## Examples

      iex> KVServer.Command.parse "CREATE shopping\r\n"
      {:ok, {:create, "shopping"}}

  """
  def parse(line) do
    :not_implemented
  end
end
```

Doctests are specified in by an indentation of four spaces followed by the `iex>` prompt in a documentation string. If a command spans multiple lines, you can use `...>`, as in IEx. The expected result should start at the next line after `iex>` or `...>` line(s) and is terminated either by a newline or a new `iex>` prefix.

Also note that we started the documentation string using `@doc ~S"""`. The `~S` prevents the `\r\n` characters from being converted to a carriage return and line feed until they are evaluated in the test.

To run our doctests, we'll create a file at `test/kv_server/command_test.exs` and call `doctest KVServer.Command` in the test case:

```elixir
defmodule KVServer.CommandTest do
  use ExUnit.Case, async: true
  doctest KVServer.Command
end
```

Run the test suite and the doctest should fail:

    1) test doc at KVServer.Command.parse/1 (1) (KVServer.CommandTest)
       test/kv_server/command_test.exs:3
       Doctest failed
       code: KVServer.Command.parse "CREATE shopping\r\n" === {:ok, {:create, "shopping"}}
       lhs:  :not_implemented
       stacktrace:
         lib/kv_server/command.ex:11: KVServer.Command (module)

Excellent!

Now it is just a matter of making the doctest pass. Let's implement the `parse/1` function:

```elixir
def parse(line) do
  case String.split(line) do
    ["CREATE", bucket] -> {:ok, {:create, bucket}}
  end
end
```

Our implementation simply splits the line on whitespace and then matches the command against a list. Using `String.split/1` means our commands will be whitespace-insensitive. Leading and trailing whitespace won't matter, nor will consecutive spaces between words. Let's add some new doctests to test this behaviour along with the other commands:

```elixir
@doc ~S"""
Parses the given `line` into a command.

## Examples

    iex> KVServer.Command.parse "CREATE shopping\r\n"
    {:ok, {:create, "shopping"}}

    iex> KVServer.Command.parse "CREATE  shopping  \r\n"
    {:ok, {:create, "shopping"}}

    iex> KVServer.Command.parse "PUT shopping milk 1\r\n"
    {:ok, {:put, "shopping", "milk", "1"}}

    iex> KVServer.Command.parse "GET shopping milk\r\n"
    {:ok, {:get, "shopping", "milk"}}

    iex> KVServer.Command.parse "DELETE shopping eggs\r\n"
    {:ok, {:delete, "shopping", "eggs"}}

Unknown commands or commands with the wrong number of
arguments return an error:

    iex> KVServer.Command.parse "UNKNOWN shopping eggs\r\n"
    {:error, :unknown_command}

    iex> KVServer.Command.parse "GET shopping\r\n"
    {:error, :unknown_command}

"""
```

With doctests at hand, it is your turn to make tests pass! Once you're ready, you can compare your work with our solution below:

```elixir
def parse(line) do
  case String.split(line) do
    ["CREATE", bucket] -> {:ok, {:create, bucket}}
    ["GET", bucket, key] -> {:ok, {:get, bucket, key}}
    ["PUT", bucket, key, value] -> {:ok, {:put, bucket, key, value}}
    ["DELETE", bucket, key] -> {:ok, {:delete, bucket, key}}
    _ -> {:error, :unknown_command}
  end
end
```

Notice how we were able to elegantly parse the commands without adding a bunch of `if/else` clauses that check the command name and number of arguments!

Finally, you may have observed that each doctest was considered to be a different test in our test case, as our test suite now reports a total of 7 tests. That is because ExUnit considers the following to define two different tests:

```iex
iex> KVServer.Command.parse "UNKNOWN shopping eggs\r\n"
{:error, :unknown_command}

iex> KVServer.Command.parse "GET shopping\r\n"
{:error, :unknown_command}
```

Without new lines, as seen below, ExUnit compiles it into a single test:

```iex
iex> KVServer.Command.parse "UNKNOWN shopping eggs\r\n"
{:error, :unknown_command}
iex> KVServer.Command.parse "GET shopping\r\n"
{:error, :unknown_command}
```

You can read more about doctests in [the `ExUnit.DocTest` docs](/docs/stable/ex_unit/ExUnit.DocTest.html).

## 9.2 Pipelines

With our command parser in hand, we can finally start implementing the logic that runs the commands. Let's add a stub definition for this function for now:

```elixir
defmodule KVServer.Command do
  @doc """
  Runs the given command.
  """
  def run(command) do
    {:ok, "OK\r\n"}
  end
end
```

Before we implement this function, let's change our server to start using our new `parse/1` and `run/1` functions. Remember, our `read_line/1` function was also crashing when the client closed the socket, so let's take the opportunity to fix it, too. Open up `lib/kv_server.ex` and replace the existing server definition:

```elixir
defp serve(socket) do
  socket
  |> read_line()
  |> write_line(socket)

  serve(socket)
end

defp read_line(socket) do
  {:ok, data} = :gen_tcp.recv(socket, 0)
  data
end

defp write_line(line, socket) do
  :gen_tcp.send(socket, line)
end
```

with the following:

```elixir
defp serve(socket) do
  msg =
    case read_line(socket) do
      {:ok, data} ->
        case KVServer.Command.parse(data) do
          {:ok, command} ->
            KVServer.Command.run(command)
          {:error, _} = err ->
            err
        end
      {:error, _} = err ->
        err
    end

  write_line(socket, msg)
  serve(socket)
end

defp read_line(socket) do
  :gen_tcp.recv(socket, 0)
end

defp write_line(socket, msg) do
  :gen_tcp.send(socket, format_msg(msg))
end

defp format_msg({:ok, text}), do: text
defp format_msg({:error, :unknown_command}), do: "UNKNOWN COMMAND\r\n"
defp format_msg({:error, _}), do: "ERROR\r\n"
```

If we start our server, we can now send commands to it. For now we will get two different responses: "OK" when the command is known and "UNKNOWN COMMAND" otherwise:

    $ telnet 127.0.0.1 4040
    Trying 127.0.0.1...
    Connected to localhost.
    Escape character is '^]'.
    CREATE shopping
    OK
    HELLO
    UNKNOWN COMMAND

This means our implementation is going in the correct direction, but it doesn't look very elegant, does it?

The previous implementation used pipes which made the logic straight-forward to understand:

```elixir
read_line(socket) |> KVServer.Command.parse |> KVServer.Command.run()
```

Since we may have failures along the way, we need our pipeline logic to match error outputs and abort if they occur. Wouldn't it be great if instead we could say: "pipe these functions while the response is `:ok`" or "pipe these functions while the response matches the `{:ok, _}` tuple"?

Thankfully, there is a project called [elixir-pipes](https://github.com/batate/elixir-pipes) that provides exactly this functionality! Let's give it a try.

Open up your `apps/kv_server/mix.exs` file and change both `application/0` and `deps/0` functions to the following:

```elixir
def application do
  [applications: [:logger, :pipe, :kv],
   mod: {KVServer, []}]
end

defp deps do
  [{:kv, in_umbrella: true},
   {:pipe, github: "batate/elixir-pipes"}]
end
```

Run `mix deps.get` to get the dependency, and rewrite the `serve/1` function to use the `pipe_matching/3` functionality now available to us:

```elixir
defp serve(socket) do
  import Pipe

  msg =
    pipe_matching x, {:ok, x},
      read_line(socket)
      |> KVServer.Command.parse()
      |> KVServer.Command.run()

  write_line(socket, msg)
  serve(socket)
end
```

With `pipe_matching/3` we can ask Elixir to pipe the value `x` from each step if it matches `{:ok, x}`. We do so by basically converting each expression given to `case/2` as a step in the pipeline. As soon as any of the steps return something that does not match `{:ok, x}`, the pipeline aborts, and returns the non-matching value.

Excellent! Feel free to read the [elixir-pipes](https://github.com/batate/elixir-pipes) project documentation to learn about other options for expressing pipelines. Let's continue moving forward with our server implementation.

## 9.3 Running commands

The last step is to implement `KVServer.Command.run/1`, to run the parsed commands against the `:kv` application. Its implementation is shown below:

```elixir
@doc """
Runs the given command.
"""
def run(command)

def run({:create, bucket}) do
  KV.Registry.create(KV.Registry, bucket)
  {:ok, "OK\r\n"}
end

def run({:get, bucket, key}) do
  lookup bucket, fn pid ->
    value = KV.Bucket.get(pid, key)
    {:ok, "#{value}\r\nOK\r\n"}
  end
end

def run({:put, bucket, key, value}) do
  lookup bucket, fn pid ->
    KV.Bucket.put(pid, key, value)
    {:ok, "OK\r\n"}
  end
end

def run({:delete, bucket, key}) do
  lookup bucket, fn pid ->
    KV.Bucket.delete(pid, key)
    {:ok, "OK\r\n"}
  end
end

defp lookup(bucket, callback) do
  case KV.Registry.lookup(KV.Registry, bucket) do
    {:ok, pid} -> callback.(pid)
    :error -> {:error, :not_found}
  end
end
```

The implementation is straightforward: we just dispatch to the `KV.Registry` server that we registered during the `:kv` application startup.

Note that we have also defined a private function named `lookup/2` to help with the common functionality of looking up a bucket and returning its `pid` if it exists, `{:error, :not_found}` otherwise.

By the way, since we are now returning `{:error, :not_found}`, we should amend the `format_msg/1` function in `KV.Server` to nicely show not found messages too:

```elixir
defp format_msg({:ok, text}), do: text
defp format_msg({:error, :unknown_command}), do: "UNKNOWN COMMAND\r\n"
defp format_msg({:error, :not_found}), do: "NOT FOUND\r\n"
defp format_msg({:error, _}), do: "ERROR\r\n"
```

And our server functionality is almost complete! We just need to add tests. This time, we have left tests for last because there are some important considerations to be made.

`KVServer.Command.run/1`'s implementation is sending commands directly to the server named `KV.Registry`, which is registered by the `:kv` application. This means this server is global and if we have two tests sending messages to it at the same time, our tests will conflict with each other (and likely fail). We need to decide between having unit tests that are isolated and can run asynchronously, or writing integration tests that work on top of the global state, but exercise our application's full stack as it is meant to be exercised in production.

So far we have been chosing the unit test approach. For example, in order to make `KVServer.Command.run/1` testable as a unit we would need to change its implementation to not send commands directly to the `KV.Registry` process but instead pass a server as argument. This means we would need to change `run`'s signature to `def run(command, pid)` and the implementation for the `:create` command would look like:

```elixir
def run({:create, bucket}, pid) do
  KV.Registry.create(pid, bucket)
  {:ok, "OK\r\n"}
end
```

Then in `KVServer.Command`'s test case, we would need to start an instance of the `KV.Registry`, similar to what we've done in `apps/kv/test/kv/registry_test.exs`, and pass it as an argument to `run/2`.

This has been the approach we have taken so far in our tests, and it has some benefits:

1. Our implementation is not coupled to any particular server name
2. We can keep our tests running asynchronously, because there is no shared state

However, it comes with the downside that our APIs become increasingly large in order to accommodate all external parameters.

The alternative is to continue relying on the global server names and run tests against the global data, ensuring we clean up the data in between the tests. In this case, since the test would exercise the whole stack, from the TCP server, to the command parsing and running, to the registry and finally reaching the bucket, it becomes an integration test.

The downside of integration tests is that they can be much slower than unit tests, and as such they must be used more sparingly. For example, we should not use integration tests to test an edge case in our command parsing implementation.

Since we have used unit tests so far, this time we will take the other road and write an integration test. The integration test will have a TCP client that sends commands to our server and we will assert that we are getting the desired responses.

Let's implement our integration test in `test/kv_server_test.exs` as shown below:

```elixir
defmodule KVServerTest do
  use ExUnit.Case

  setup do
    :application.stop(:kv)
    :ok = :application.start(:kv)
  end

  setup do
    opts = [:binary, packet: :line, active: false]
    {:ok, socket} = :gen_tcp.connect('localhost', 4040, opts)
    {:ok, socket: socket}
  end

  test "server interaction", %{socket: socket} do
    assert send_and_recv(socket, "UNKNOWN shopping\r\n") ==
           "UNKNOWN COMMAND\r\n"

    assert send_and_recv(socket, "GET shopping eggs\r\n") ==
           "NOT FOUND\r\n"

    assert send_and_recv(socket, "CREATE shopping\r\n") ==
           "OK\r\n"

    assert send_and_recv(socket, "PUT shopping eggs 3\r\n") ==
           "OK\r\n"

    # GET returns two lines
    assert send_and_recv(socket, "GET shopping eggs\r\n") == "3\r\n"
    assert send_and_recv(socket, "") == "OK\r\n"

    assert send_and_recv(socket, "DELETE shopping eggs\r\n") ==
           "OK\r\n"

    # GET returns two lines
    assert send_and_recv(socket, "GET shopping eggs\r\n") == "\r\n"
    assert send_and_recv(socket, "") == "OK\r\n"
  end

  defp send_and_recv(socket, command) do
    :ok = :gen_tcp.send(socket, command)
    {:ok, data} = :gen_tcp.recv(socket, 0, 1000)
    data
  end
end
```

Our integration test checks all server interaction, including unknown commands and not found errors. It is worth noting that, as with <abbr title="Erlang Term Storage">ETS</abbr> tables and linked processes, there is no need to close the socket. Once the test process exits, the socket is automatically closed.

This time, since our test relies on global data, we have not given `async: true` to `use ExUnit.Case`. Furthermore, in order to guarantee our test is always in a clean state, we stop and start the `:kv` application before each test. In fact, stopping the `:kv` application even prints a warning on the terminal:

```
18:12:10.698 [info] Application kv exited with reason :stopped
```

If desired, we can avoid printing this warning by turning the error_logger off and on in the test setup:

```elixir
setup do
  Logger.remove_backend(:console)
  Application.stop(:kv)
  :ok = Application.start(:kv)
  Logger.add_backend(:console, flush: true)
  :ok
end
```

With this simple integration test, we start to see why integration tests may be slow. Not only can this particular test not be run asynchronously, it also requires the expensive setup of stopping and starting the `:kv` application.

At the end of the day, it is up to you and your team to figure out the best testing strategy for your applications. You need to balance code quality, confidence, and test suite runtime. For example, we may start with testing the server only with integration tests, but if the server continues to grow in future releases, or it becomes a part of the application with frequent bugs, it is important to consider breaking it apart and writing more intensive unit tests that don't have the weight of an integration test.

I personally err on the side of unit tests, and have integration tests only as smoke tests to guarantee the basic skeleton of the system works.

In the next chapter we will finally make our system distributed by adding a bucket routing mechanism. We'll also learn about application configuration.
