---
layout: getting-started
title: Task and gen_tcp
---

# {{ page.title }}

{% include toc.html %}

In this chapter, we are going to learn how to use [Erlang's `:gen_tcp` module](http://www.erlang.org/doc/man/gen_tcp.html) to serve requests. This provides a great opportunity to explore Elixir's `Task` module. In future chapters we will expand our server so it can actually serve the commands.

## Echo server

We will start our TCP server by first implementing an echo server. It will simply send a response with the text it received in the request. We will slowly improve our server until it is supervised and ready to handle multiple connections.

A TCP server, in broad strokes, performs the following steps:

1. Listens to a port until the port is available and it gets hold of the socket
2. Waits for a client connection on that port and accepts it
3. Reads the client request and writes a response back

Let's implement those steps. Move to the `apps/kv_server` application, open up `lib/kv_server.ex`, and add the following functions:

```elixir
require Logger

def accept(port) do
  # The options below mean:
  #
  # 1. `:binary` - receives data as binaries (instead of lists)
  # 2. `packet: :line` - receives data line by line
  # 3. `active: false` - blocks on `:gen_tcp.recv/2` until data is available
  # 4. `reuseaddr: true` - allows us to reuse the address if the listener crashes
  #
  {:ok, socket} = :gen_tcp.listen(port,
                    [:binary, packet: :line, active: false, reuseaddr: true])
  Logger.info "Accepting connections on port #{port}"
  loop_acceptor(socket)
end

defp loop_acceptor(socket) do
  {:ok, client} = :gen_tcp.accept(socket)
  serve(client)
  loop_acceptor(socket)
end

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

We are going to start our server by calling `KVServer.accept(4040)`, where 4040 is the port. The first step in `accept/1` is to listen to the port until the socket becomes available and then call `loop_acceptor/1`. `loop_acceptor/1` is just a loop accepting client connections. For each accepted connection, we call `serve/1`.

`serve/1` is another loop that reads a line from the socket and writes those lines back to the socket. Note that the `serve/1` function uses [the pipe operator `|>`](/docs/stable/elixir/Kernel.html#%7C%3E/2) to express this flow of operations. The pipe operator evaluates the left side and passes its result as first argument to the function on the right side. The example above:

```elixir
socket |> read_line() |> write_line(socket)
```

is equivalent to:

```elixir
write_line(read_line(socket), socket)
```

The `read_line/1` implementation receives data from the socket using `:gen_tcp.recv/2` and `write_line/2` writes to the socket using `:gen_tcp.send/2`.

This is pretty much all we need to implement our echo server. Let's give it a try!

Start an IEx session inside the `kv_server` application with `iex -S mix`. Inside IEx, run:

```iex
iex> KVServer.accept(4040)
```

The server is now running, and you will even notice the console is blocked. Let's use [a `telnet` client](https://en.wikipedia.org/wiki/Telnet) to access our server. There are clients available on most operating systems, and their command lines are generally similar:

```bash
$ telnet 127.0.0.1 4040
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
hello
hello
is it me
is it me
you are looking for?
you are looking for?
```

Type "hello", press enter, and you will get "hello" back. Excellent!

My particular telnet client can be exited by typing `ctrl + ]`, typing `quit`, and pressing `<Enter>`, but your client may require different steps.

Once you exit the telnet client, you will likely see an error in the IEx session:

    ** (MatchError) no match of right hand side value: {:error, :closed}
        (kv_server) lib/kv_server.ex:41: KVServer.read_line/1
        (kv_server) lib/kv_server.ex:33: KVServer.serve/1
        (kv_server) lib/kv_server.ex:27: KVServer.loop_acceptor/1

That's because we were expecting data from `:gen_tcp.recv/2` but the client closed the connection. We need to handle such cases better in future revisions of our server.

For now there is a more important bug we need to fix: what happens if our TCP acceptor crashes? Since there is no supervision, the server dies and we won't be able to serve more requests, because it won't be restarted. That's why we must move our server to a supervision tree.

## Tasks

We have learned about agents, generic servers, and supervisors. They are all meant to work with multiple messages or manage state. But what do we use when we only need to execute some task and that is it?

[The Task module](/docs/stable/elixir/Task.html) provides this functionality exactly. For example, it has a `start_link/3` function that receives a module, function and arguments, allowing us to run a given function as part of a supervision tree.

Let's give it a try. Open up `lib/kv_server.ex`, and let's change the supervisor in the `start/2` function to the following:

```elixir
def start(_type, _args) do
  import Supervisor.Spec

  children = [
    worker(Task, [KVServer, :accept, [4040]])
  ]

  opts = [strategy: :one_for_one, name: KVServer.Supervisor]
  Supervisor.start_link(children, opts)
end
```

With this change, we are saying that we want to run `KVServer.accept(4040)` as a worker. We are hardcoding the port for now, but we will discuss ways in which this could be changed later.

Now that the server is part of the supervision tree, it should start automatically when we run the application. Type `mix run --no-halt` in the terminal, and once again use the `telnet` client to make sure that everything still works:

```bash
$ telnet 127.0.0.1 4040
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
say you
say you
say me
say me
```

Yes, it works! If you kill the client, causing the whole server to crash, you will see another one starts right away. However, does it *scale*?

Try to connect two telnet clients at the same time. When you do so, you will notice that the second client doesn't echo:

```bash
$ telnet 127.0.0.1 4040
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
hello
hello?
HELLOOOOOO?
```

It doesn't seem to work at all. That's because we are serving requests in the same process that are accepting connections. When one client is connected, we can't accept another client.

## Task supervisor

In order to make our server handle simultaneous connections, we need to have one process working as an acceptor that spawns other processes to serve requests. One solution would be to change:

```elixir
defp loop_acceptor(socket) do
  {:ok, client} = :gen_tcp.accept(socket)
  serve(client)
  loop_acceptor(socket)
end
```

to use `Task.start_link/1`, which is similar to `Task.start_link/3`, but it receives an anonymous function instead of module, function and arguments:

```elixir
defp loop_acceptor(socket) do
  {:ok, client} = :gen_tcp.accept(socket)
  Task.start_link(fn -> serve(client) end)
  loop_acceptor(socket)
end
```

We are starting a linked Task directly from the acceptor process. But we've already made this mistake once. Do you remember?

This is similar to the mistake we made when we called `KV.Bucket.start_link/0` straight from the registry. That meant a failure in any bucket would bring the whole registry down.

The code above would have the same flaw: if we link the `serve(client)` task to the acceptor, a crash when serving a request would bring the acceptor, and consequently all other connections, down.

We fixed the issue for the registry by using a simple one for one supervisor. We are going to use the same tactic here, except that this pattern is so common with tasks that `Task` already comes with a solution: a simple one for one supervisor with temporary workers that we can just use in our supervision tree!

Let's change `start/2` once again, to add a supervisor to our tree:

```elixir
def start(_type, _args) do
  import Supervisor.Spec

  children = [
    supervisor(Task.Supervisor, [[name: KVServer.TaskSupervisor]]),
    worker(Task, [KVServer, :accept, [4040]])
  ]

  opts = [strategy: :one_for_one, name: KVServer.Supervisor]
  Supervisor.start_link(children, opts)
end
```

We simply start a [`Task.Supervisor`](/docs/stable/elixir/Task.Supervisor.html) process with name `KVServer.TaskSupervisor`. Remember, since the acceptor task depends on this supervisor, the supervisor must be started first.

Now we just need to change `loop_acceptor/1` to use `Task.Supervisor` to serve each request:

```elixir
defp loop_acceptor(socket) do
  {:ok, client} = :gen_tcp.accept(socket)
  {:ok, pid} = Task.Supervisor.start_child(KVServer.TaskSupervisor, fn -> serve(client) end)
  :ok = :gen_tcp.controlling_process(client, pid)
  loop_acceptor(socket)
end
```

You might notice that we added a line, `:ok = :gen_tcp.controlling_process(client, pid)`. This makes the child process the "controlling process" of the `client` socket. If we didn't do this, the acceptor would bring down all the clients if it crashed because sockets are tied to the process that `accept`ed them by default.

Start a new server with `mix run --no-halt` and we can now open up many concurrent telnet clients. You will also notice that quitting a client does not bring the acceptor down. Excellent!

Here is the full echo server implementation, in a single module:

```elixir
defmodule KVServer do
  use Application
  require Logger

  @doc false
  def start(_type, _args) do
    import Supervisor.Spec

    children = [
      supervisor(Task.Supervisor, [[name: KVServer.TaskSupervisor]]),
      worker(Task, [KVServer, :accept, [4040]])
    ]

    opts = [strategy: :one_for_one, name: KVServer.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @doc """
  Starts accepting connections on the given `port`.
  """
  def accept(port) do
    {:ok, socket} = :gen_tcp.listen(port,
                      [:binary, packet: :line, active: false, reuseaddr: true])
    Logger.info "Accepting connections on port #{port}"
    loop_acceptor(socket)
  end

  defp loop_acceptor(socket) do
    {:ok, client} = :gen_tcp.accept(socket)
    {:ok, pid} = Task.Supervisor.start_child(KVServer.TaskSupervisor, fn -> serve(client) end)
    :ok = :gen_tcp.controlling_process(client, pid)
    loop_acceptor(socket)
  end

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
end
```

Since we have changed the supervisor specification, we need to ask: is our supervision strategy still correct?

In this case, the answer is yes: if the acceptor crashes, there is no need to crash the existing connections. On the other hand, if the task supervisor crashes, there is no need to crash the acceptor too.

In the next chapter we will start parsing the client requests and sending responses, finishing our server.
