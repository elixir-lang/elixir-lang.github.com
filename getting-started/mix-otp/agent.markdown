---
layout: getting-started
title: Agent
---

# {{ page.title }}

{% include toc.html %}

{% include mix-otp-preface.html %}

In this chapter, we will create a module named `KV.Bucket`. This module will be responsible for storing our key-value entries in a way that allows them to be read and modified by other processes.

If you have skipped the Getting Started guide or read it long ago, be sure to re-read the [Processes](/getting-started/processes.html) chapter. We will use it as a starting point.

## The trouble with state

Elixir is an immutable language where nothing is shared by default. If we want to provide buckets, which can be read and modified from multiple places, we have two main options in Elixir:

* Processes
* [ETS (Erlang Term Storage)](http://www.erlang.org/doc/man/ets.html)

We covered processes in the Getting Started guide. <abbr title="Erlang Term Storage">ETS</abbr> is a new topic that will explore on later chapters. When it comes to processes though, we rarely hand-roll our own, instead we use the abstractions available in Elixir and  <abbr title="Open Telecom Platform">OTP</abbr>:

* [Agent](https://hexdocs.pm/elixir/Agent.html) - Simple wrappers around state.
* [GenServer](https://hexdocs.pm/elixir/GenServer.html) - "Generic servers" (processes) that encapsulate state, provide sync and async calls, support code reloading, and more.
* [Task](https://hexdocs.pm/elixir/Task.html) - Asynchronous units of computation that allow spawning a process and potentially retrieving its result at a later time.

We will explore most of these abstractions in this guide. Keep in mind that they are all implemented on top of processes using the basic features provided by the <abbr title="Virtual Machine">VM</abbr>, like `send`, `receive`, `spawn` and `link`.

## Agents

[Agents](https://hexdocs.pm/elixir/Agent.html) are simple wrappers around state. If all you want from a process is to keep state, agents are a great fit. Let's start an `iex` session inside the project with:

```bash
$ iex -S mix
```

And play a bit with agents:

```iex
iex> {:ok, agent} = Agent.start_link fn -> [] end
{:ok, #PID<0.57.0>}
iex> Agent.update(agent, fn list -> ["eggs" | list] end)
:ok
iex> Agent.get(agent, fn list -> list end)
["eggs"]
iex> Agent.stop(agent)
:ok
```

We started an agent with an initial state of an empty list. We updated the agent's state, adding our new item to the head of the list. The second argument of [`Agent.update/3`](https://hexdocs.pm/elixir/Agent.html#update/3) is a function that takes the agent's current state as input and returns its desired new state. Finally, we retrieved the whole list. The second argument of [`Agent.get/3`](https://hexdocs.pm/elixir/Agent.html#get/3) is a function that takes the state as input and returns the value that [`Agent.get/3`](https://hexdocs.pm/elixir/Agent.html#get/3) itself will return. Once we are done with the agent, we can call [`Agent.stop/3`](https://hexdocs.pm/elixir/Agent.html#stop/3) to terminate the agent process.

Let's implement our `KV.Bucket` using agents. But before starting the implementation, let's first write some tests. Create a file at `test/kv/bucket_test.exs` (remember the `.exs` extension) with the following:

```elixir
defmodule KV.BucketTest do
  use ExUnit.Case, async: true

  test "stores values by key" do
    {:ok, bucket} = start_supervised KV.Bucket
    assert KV.Bucket.get(bucket, "milk") == nil

    KV.Bucket.put(bucket, "milk", 3)
    assert KV.Bucket.get(bucket, "milk") == 3
  end
end
```

Our first test starts a new `KV.Bucket` using the `start_supervised` function and performs some `get/2` and `put/3` operations on it, asserting the result. We don't need to explicitly stop the agent because we used `start_supervised/2` and that takes care of automatically terminating the processes under test when the test finishes.

Also note the `async: true` option passed to `ExUnit.Case`. This option makes the test case run in parallel with other `:async` test cases by using multiple cores in our machine. This is extremely useful to speed up our test suite. However, `:async` must *only* be set if the test case does not rely on or change any global values. For example, if the test requires writing to the filesystem or access a database, keep it synchronous (omit the `:async` option) to avoid race conditions between tests.

Async or not, our new test should obviously fail, as none of the functionality is implemented in the module being tested:

```
** (ArgumentError) The module KV.Bucket was given as a child to a supervisor but it does not implement child_spec/1
```

Since the module has not yet been defined, the `child_spec/1` does not yet exist.

In order to fix the failing test, let's create a file at `lib/kv/bucket.ex` with the contents below. Feel free to give a try at implementing the `KV.Bucket` module yourself using agents before peeking at the implementation below.

```elixir
defmodule KV.Bucket do
  use Agent

  @doc """
  Starts a new bucket.
  """
  def start_link(_opts) do
    Agent.start_link(fn -> %{} end)
  end

  @doc """
  Gets a value from the `bucket` by `key`.
  """
  def get(bucket, key) do
    Agent.get(bucket, &Map.get(&1, key))
  end

  @doc """
  Puts the `value` for the given `key` in the `bucket`.
  """
  def put(bucket, key, value) do
    Agent.update(bucket, &Map.put(&1, key, value))
  end
end
```

The first step in our implementation is to call `use Agent`. By doing so, it will define a `child_spec/1` function containing the exact steps to start our process.

Then we define a `start_link/1` function, which will effectively start the agent. The `start_link/1` function always receives a list of options, but we don't plan on using it right now. We then proceed to call `Agent.start_link/1`, which receives an anonymous function that returns the Agent initial state.

We are keeping a map inside the agent to store our keys and values. Getting and putting values on the map is done with the Agent API  and the capture operator `&`, introduced in [the Getting Started guide](/getting-started/modules-and-functions.html#function-capturing).

Now that the `KV.Bucket` module has been defined, our test should pass! You can try it yourself by running: `mix test`.

## Test setup with ExUnit callbacks

Before moving on and adding more features to `KV.Bucket`, let's talk about ExUnit callbacks. As you may expect, all `KV.Bucket` tests will require a bucket agent to be up and running. Luckily, ExUnit supports callbacks that allow us to skip such repetitive tasks.

Let's rewrite the test case to use callbacks:

```elixir
defmodule KV.BucketTest do
  use ExUnit.Case, async: true

  setup do
    {:ok, bucket} = start_supervised(KV.Bucket)
    %{bucket: bucket}
  end

  test "stores values by key", %{bucket: bucket} do
    assert KV.Bucket.get(bucket, "milk") == nil

    KV.Bucket.put(bucket, "milk", 3)
    assert KV.Bucket.get(bucket, "milk") == 3
  end
end
```

We have first defined a setup callback with the help of the `setup/1` macro. The `setup/1` callback runs before every test, in the same process as the test itself.

Note that we need a mechanism to pass the `bucket` pid from the callback to the test. We do so by using the *test context*. When we return `%{bucket: bucket}` from the callback, ExUnit will merge this map into the test context. Since the test context is a map itself, we can pattern match the bucket out of it, providing access to the bucket inside the test:

```elixir
test "stores values by key", %{bucket: bucket} do
  # `bucket` is now the bucket from the setup block
end
```

You can read more about ExUnit cases in the [`ExUnit.Case` module documentation](https://hexdocs.pm/ex_unit/ExUnit.Case.html) and more about callbacks in [`ExUnit.Callbacks` docs](https://hexdocs.pm/ex_unit/ExUnit.Callbacks.html).

## Other agent actions

Besides getting a value and updating the agent state, agents allow us to get a value and update the agent state in one function call via `Agent.get_and_update/2`. Let's implement a `KV.Bucket.delete/2` function that deletes a key from the bucket, returning its current value:

```elixir
@doc """
Deletes `key` from `bucket`.

Returns the current value of `key`, if `key` exists.
"""
def delete(bucket, key) do
  Agent.get_and_update(bucket, &Map.pop(&1, key))
end
```

Now it is your turn to write a test for the functionality above! Also, be sure to explore [the documentation for the `Agent` module](https://hexdocs.pm/elixir/Agent.html) to learn more about them.

## Client/Server in agents

Before we move on to the next chapter, let's discuss the client/server dichotomy in agents. Let's expand the `delete/2` function we have just implemented:

```elixir
def delete(bucket, key) do
  Agent.get_and_update(bucket, fn dict ->
    Map.pop(dict, key)
  end)
end
```

Everything that is inside the function we passed to the agent happens in the agent process. In this case, since the agent process is the one receiving and responding to our messages, we say the agent process is the server. Everything outside the function is happening in the client.

This distinction is important. If there are expensive actions to be done, you must consider if it will be better to perform these actions on the client or on the server. For example:

```elixir
def delete(bucket, key) do
  Process.sleep(1000) # puts client to sleep
  Agent.get_and_update(bucket, fn dict ->
    Process.sleep(1000) # puts server to sleep
    Map.pop(dict, key)
  end)
end
```

When a long action is performed on the server, all other requests to that particular server will wait until the action is done, which may cause some clients to timeout.

In the next chapter we will explore GenServers, where the segregation between clients and servers is made more apparent.
