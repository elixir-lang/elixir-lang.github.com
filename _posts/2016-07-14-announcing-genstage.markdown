---
layout: post
title: Announcing GenStage
author: José Valim
category: Announcements
excerpt: GenStage is a new Elixir behaviour for exchanging events with back-pressure between Elixir processes. In this blog post we will cover the background that led us to GenStage, some example use cases, and what we are exploring for future releases.
---

Today we are glad to announce the official release of GenStage. GenStage is a new Elixir behaviour for exchanging events with back-pressure between Elixir processes. In the short-term, we expect GenStage to replace the use cases for GenEvent as well as providing a composable abstraction for consuming data from third-party systems.

In this blog post we will cover the background that led us to GenStage, some example use cases, and what we are exploring for future releases. If instead you are looking for a quick reference, [check the project source code](https://github.com/elixir-lang/gen_stage) and [access its documentation](https://hexdocs.pm/gen_stage/Experimental.GenStage.html).

## Background

One of the original motivations for [creating and designing Elixir was to introduce better abstractions for working with collections](https://www.youtube.com/watch?v=Lqo9-pQuRKE). Not only that, we want to provide developers interested in manipulating collections with a path to take their code from eager to lazy, to concurrent and then distributed.

Let's discuss a simple but actual example: word counting. The idea of word counting is to receive one file and count how many times each word appears in the document. Using the `Enum` module it could be implemented as follows:

```elixir
File.read!("path/to/some/file")
|> String.split("\n")
|> Enum.flat_map(fn line ->
    String.split(line, " ")
   end)
|> Enum.reduce(%{}, fn word, acc ->
    Map.update(acc, word, 1, & &1 + 1)
   end)
|> Enum.to_list()
```

While the solution above works fine and is efficient for small files, it is quite restrictive for large inputs as it loads the whole file into memory.

Another issue with the solution above is that the `Enum.flat_map/2` step will build a huge list, with all the words in the file, before we effectively start counting them. Again, for a large document, this means more memory usage and a waste of processing time in building a list that will be traversed right after.

Luckily, Elixir provides a solution to this problem (and has provided it for quite some time): streams. One of the advantage of streams is they are lazy, allowing us to traverse collections item by item, in this case, line by line, instead of loading the whole data set into memory. Let's rewrite the example above to use streams:

```elixir
File.stream!("path/to/some/file")
|> Stream.flat_map(fn line ->
    String.split(line, " ")
   end)
|> Enum.reduce(%{}, fn word, acc ->
    Map.update(acc, word, 1, & &1 + 1)
   end)
|> Enum.to_list()
```

By using `File.stream!` and `Stream.flat_map`, we build a lazy computation that will emit a single line, break that line into words, and emit such words one by one without building huge lists in memory when enumerated. The functions in the [Stream module](https://hexdocs.pm/elixir/Stream.html) just express the computation we want to perform. The computation itself, like traversing the file or breaking into words in `flat_map`, only happens when we call a function in the `Enum` module. We have covered [the foundation for Enum and Streams](https://dashbit.co/blog/introducing-reducees) in another article.

The solution above allows us to work with large datasets without loading them all into memory. For large files, it is going to provide much better performance than the eager version. However, the solution above still does not leverage concurrency. For a machine with more than one core, which is the huge majority of machines we have available today, it is a suboptimal solution.

That said, how could we leverage concurrency in the example above?

During my ElixirConf 2015 keynote, [I discussed one of the most immediate solutions to this problem](http://confreaks.tv/videos/elixirconf2015-keynote) which was to convert parts of your pipeline to separate processes:

```elixir
File.stream!("path/to/some/file")
|> Stream.flat_map(fn line ->
    String.split(line, " ")
   end)
|> Stream.async()  # NEW!
|> Enum.reduce(%{}, fn word, acc ->
    Map.update(acc, word, 1, & &1 + 1)
   end)
|> Enum.to_list()
```

The idea is that `Stream.async` would run the previous computations in a separate process that would stream its messages to the process that called `Enum.reduce`. Unfortunately, the solution above is less than ideal.

First of all, we want to avoid moving data between processes as much as possible. Instead, we want to start multiple processes that perform the same computation in parallel. Not only that, if we are requiring developers to place `Stream.async` manually, it may lead to inefficient and error prone solutions.

Although the solution above has many flaws, it has helped us ask the right questions:

  * If `Stream.async` is introducing new processes, how can we guarantee those processes are supervised?

  * Since we are exchanging messages between processes, how do we prevent a process from receiving too many messages? We need a back-pressure mechanism that allows the receiving process to specify how much it can handle from the sending process.

We have jumped through different abstractions trying to answer those questions until we have finally settled on GenStage.

## GenStage

GenStage is a new Elixir behaviour for exchanging events with back-pressure between Elixir processes. Developers who use GenStage only need to worry about how the data is produced, manipulated and consumed. The act of dispatching the data and providing back-pressure is completely abstracted away from the developers.

As a quick example, let's write a simple pipeline that will produce events as increasing numbers, multiply those numbers by two, and then print them to the terminal. We will do so by implementing three stages, the `:producer`, the `:producer_consumer` and the `:consumer`, which we will call `A`, `B` and `C` respectively. We will go back to the word counting example at the end of this post.

Let's start with the producer that we will call `A`. Since `A` is a producer, its main responsibility is to receive demand, which is the number of events the consumer is willing to handle, and generate events. Those events may be in memory or an external data source. For now let's implement a simple counter starting from a given value of `counter` received on `init/1`:

Note: all of the modules in the `GenStage` project are prefixed with the `Experimental` namespace. That's why the examples below and your code should `alias Experimental.GenStage` at the top of your files.

```elixir
alias Experimental.GenStage

defmodule A do
  use GenStage

  def init(counter) do
    {:producer, counter}
  end

  def handle_demand(demand, counter) when demand > 0 do
    # If the counter is 3 and we ask for 2 items, we will
    # emit the items 3 and 4, and set the state to 5.
    events = Enum.to_list(counter..counter+demand-1)

    # The events to emit is the second element of the tuple,
    # the third being the state.
    {:noreply, events, counter + demand}
  end
end
```

`B` is a producer-consumer. This means it does not explicitly handle the demand because the demand is always forwarded to its producers. Once `A` receives the demand from `B`, it will send events to `B` which will be transformed by `B` as desired and then sent to `C`. In our case, B will receive events and multiply them by a number given on initialization and stored as the state:

```elixir
alias Experimental.GenStage

defmodule B do
  use GenStage

  def init(number) do
    {:producer_consumer, number}
  end

  def handle_events(events, _from, number) do
    events = Enum.map(events, & &1 * number)
    {:noreply, events, number}
  end
end
```

`C` is the consumer which will finally receive those events and print them every second to the terminal:

```elixir
alias Experimental.GenStage

defmodule C do
  use GenStage

  def init(sleeping_time) do
    {:consumer, sleeping_time}
  end

  def handle_events(events, _from, sleeping_time) do
    # Print events to terminal.
    IO.inspect(events)

    # Sleep the configured time.
    Process.sleep(sleeping_time)

    # We are a consumer, so we never emit events.
    {:noreply, [], sleeping_time}
  end
end
```

With the stages defined, we can start and connect them:

```elixir
{:ok, a} = GenStage.start_link(A, 0)    # starting from zero
{:ok, b} = GenStage.start_link(B, 2)    # multiply by 2
{:ok, c} = GenStage.start_link(C, 1000) # sleep for a second

GenStage.sync_subscribe(c, to: b)
GenStage.sync_subscribe(b, to: a)

# Sleep so we see events printed.
Process.sleep(:infinity)
```

As soon as we subscribe the stages, we should see items being printed to the terminal. Notice that, even though we have introduced a sleep command to the consumer, the producers will never overflow the consumer with data. That's because the communication between stages is demand-driven. The producer can only send items to consumers after the consumers have sent demand upstream. The producer must never send more items than the consumer has specified.

One consequence of this design decision is that parallelizing stateless stages like the consumer above is really straightforward:

```elixir
{:ok, a} = GenStage.start_link(A, 0)     # starting from zero
{:ok, b} = GenStage.start_link(B, 2)     # multiply by 2

{:ok, c1} = GenStage.start_link(C, 1000) # sleep for a second
{:ok, c2} = GenStage.start_link(C, 1000) # sleep for a second
{:ok, c3} = GenStage.start_link(C, 1000) # sleep for a second
{:ok, c4} = GenStage.start_link(C, 1000) # sleep for a second

GenStage.sync_subscribe(c1, to: b)
GenStage.sync_subscribe(c2, to: b)
GenStage.sync_subscribe(c3, to: b)
GenStage.sync_subscribe(c4, to: b)
GenStage.sync_subscribe(b, to: a)

# Sleep so we see events printed.
Process.sleep(:infinity)
```

By simply starting multiple consumers, the stage `B` will now receive demand from multiple stages and dispatch events to those stages which are now running concurrently, always picking the stage that is able to process more items. We can also leverage concurrency from the opposite direction: if the producer is the slow stage in a pipeline, you can start multiple producers and have each consumer subscribe to them.

In order to know which consumer should receive a particular event, producer stages depend on a behaviour called [`GenStage.Dispatcher`](https://hexdocs.pm/gen_stage/Experimental.GenStage.Dispatcher.html). The default dispatcher is the `GenStage.DemandDispatcher` we have briefly described above: it will collect the demand from different consumers and dispatch to the one with highest demand. This means if one consumer is slow, maybe because we increased its sleeping time to 10 seconds, it will receive less items.

### GenStage for data-ingestion

One of the use cases for GenStage is to consume data from third-party systems. The demand system with back-pressure guarantees we won't import more data than we can effectively handle. The demand dispatcher allows us to easily leverage concurrency when processing the data by simply adding more consumers.

During the Elixir London Meetup, I have live-coded a short example that shows how to use `GenStage` to concurrently process data stored in a PostgreSQL database as a queue:

<iframe width="560" height="315" src="https://www.youtube.com/embed/aZuY5-2lwW4" class="video" allowfullscreen title="Elixir London June 2016 w/ José Valim"></iframe>

### GenStage for event dispatching

Another scenario where GenStage can be useful today is to replace cases where developers would have used [GenEvent](https://hexdocs.pm/elixir/GenEvent.html) in the past. For those unfamiliar with GenEvent, it is a behaviour where events are sent to an "event manager" which then proceeds to invoke "event handlers" for each event. GenEvent, however, has one big flaw: the event manager and all event handlers run in the same process. This means GenEvent handlers cannot easily leverage concurrency without forcing developers to implement those mechanisms themselves. Furthermore, GenEvent handlers have very awkward error semantics. Because event handlers are not separate processes, we cannot simply rely on supervisors restarting them.

GenStage solves those problems by having a producer as the event manager. The producer itself should be configured to use [`GenStage.BroadcastDispatcher`](https://hexdocs.pm/gen_stage/Experimental.GenStage.BroadcastDispatcher.html) as its dispatcher. The broadcast dispatcher will guarantee events are dispatched to all consumers in a way that does not exceed the demand of any of the consumers. This allows us to leverage concurrency and having the "event manager" as a producer gives us much more flexibility in terms of buffering and reacting to failures.

Let's see an example of building an event manager as a producer:

```elixir
alias Experimental.GenStage

defmodule EventManager do
  use GenStage

  @doc """
  Starts the manager.
  """
  def start_link() do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @doc """
  Sends an event and returns only after the event is dispatched.
  """
  def sync_notify(event, timeout \\ 5000) do
    GenStage.call(__MODULE__, {:notify, event}, timeout)
  end

  ## Callbacks

  def init(:ok) do
    {:producer, {:queue.new, 0}, dispatcher: GenStage.BroadcastDispatcher}
  end

  def handle_call({:notify, event}, from, {queue, demand}) do
    dispatch_events(:queue.in({from, event}, queue), demand, [])
  end

  def handle_demand(incoming_demand, {queue, demand}) do
    dispatch_events(queue, incoming_demand + demand, [])
  end

  defp dispatch_events(queue, demand, events) do
    with d when d > 0 <- demand,
         {item, queue} = :queue.out(queue),
         {:value, {from, event}} <- item do
      GenStage.reply(from, :ok)
      dispatch_events(queue, demand - 1, [event | events])
    else
      _ -> {:noreply, Enum.reverse(events), {queue, demand}}
    end
  end
end
```

The `EventManager` works as a buffer. If there is demand but not events to be sent, we store such demand. If there are events but no demand, we store such events in a queue. If a client tries to broadcast an event, the `sync_notify` call will block until the event is effectively broadcasted. The bulk of the logic is in the `dispatch_events/3` function that takes events from the queue while there is demand.

By implementing the event manager as a producer, we can configure all sorts of behaviours that are simply not possible with `GenEvent`, such as how much data we want to queue (or for how long) and if events should be buffered or not when there are no consumers (via the `handle_subscribe/4` and `handle_cancel/3` callbacks).

Implementing event handlers is as straightforward as writing any other consumer. We could in fact use the `C` consumer implemented earlier. However, given event managers are often defined before the handlers, it is recommended for handlers to subscribe to managers when they start:

```elixir
alias Experimental.GenStage

defmodule EventHandler do
  use GenStage

  def start_link() do
    GenStage.start_link(__MODULE__, :ok)
  end

  # Callbacks

  def init(:ok) do
    # Starts a permanent subscription to the broadcaster
    # which will automatically start requesting items.
    {:consumer, :ok, subscribe_to: [EventManager]}
  end

  def handle_events(events, _from, state) do
    IO.inspect events
    {:noreply, [], state}
  end
end
```

Such guarantees that, if a supervised `EventHandler` crashes, the supervisor will start a new event handler which will promptly subscribe to the same manager, solving the awkward error handling semantics we have seen with `GenEvent`.

## The path forward

With the release of GenStage v0.3.0, we have reached an important milestone as `GenStage` can be used as both event managers and a way to exchange events between processes, often external data sources, with back-pressure.

The v0.3.0 release also includes the [`GenStage.stream`](https://hexdocs.pm/gen_stage/Experimental.GenStage.html#stream/1) function, which allows us to consume data from a GenStage as a stream, and [`GenStage.from_enumerable`](https://hexdocs.pm/gen_stage/Experimental.GenStage.html#from_enumerable/2) which allows us to use an enumerable or a stream, like `File.stream!`, as a producer. Closing the gap between stages and streams.

However, we are far from done!

First of all, now is the moment for the community to step in and try GenStage out. If you have used GenEvent in the past, can it be replaced by a GenStage? Similarly, if you were planning to implement an event handling system, give GenStage a try.

Developers who maintain libraries that integrate with external data sources, be it a RabbitMQ, Redis or Apacha Kafka, can explore GenStage as an abstraction for consuming data from those sources. Library developers must implement producers and leave it up for their users to configure the consumer stages.

Once we get enough feedback, `GenStage` will be included in some shape as part of the standard library. The goal is to introduce `GenStage` and phase `GenEvent` out in the long term.

We, on the Elixir team, have just got started too. The next milestone for GenStage is to revisit the original problem and provide developers a clear path to take their collection processing code from eager, to lazy, to concurrent (and then distributed).

As seen earlier, today we allow developers to transform eager code into lazy by introducing streams.

```elixir
File.stream!("path/to/some/file")
|> Stream.flat_map(fn line ->
    String.split(line, " ")
   end)
|> Enum.reduce(%{}, fn word, acc ->
    Map.update(acc, word, 1, & &1 + 1)
   end)
|> Enum.to_list()
```

While the above is helpful when working with large or infinite collections, it still does not leverage concurrency. To address that, we are currently exploring a solution named [`GenStage.Flow`](https://hexdocs.pm/gen_stage/Experimental.Flow.html), that allows us to express our computations similarly to streams, except they will run across multiple stages instead of a single process:

```elixir
alias Experimental.GenStage.Flow
File.stream!("path/to/some/file")
|> Flow.from_enumerable()
|> Flow.flat_map(fn line ->
    for word <- String.split(" "), do: {word, 1}
   end)
|> Flow.reduce_by_key(& &1 + &2)
|> Enum.to_list()
```

And the highly optimized version:

```elixir
alias Experimental.GenStage.Flow

# Let's compile common patterns for performance
empty_space = :binary.compile_pattern(" ") # NEW!

File.stream!("path/to/some/file", read_ahead: 100_000) # NEW!
|> Flow.from_enumerable()
|> Flow.flat_map(fn line ->
    for word <- String.split(empty_space), do: {word, 1}
   end)
|> Flow.partition_with(storage: :ets) # NEW!
|> Flow.reduce_by_key(& &1 + &2)
|> Enum.to_list()
```

Flow will look at the computations we want to perform and start a series of stages to execute our code while keeping the amount of data being transferred between processes to a minimum. If you are interested in `GenStage.Flow` and how the computations above are spread across multiple stages, [we have written some documentation based on the prototypes we have built so far](https://hexdocs.pm/gen_stage/Experimental.Flow.html). The code itself is coming in future GenStage releases. We will also have to consider how the `GenStage.Flow` API mirrors the functions in `Enum` and `Stream` to make the path from eager to concurrent clearer.

For the word counting problem with a fixed data, early experiments show a linear increase in performance with a fixed overhead of 20%. In other words, a dataset that takes 60s with a single core, takes 36s on a machine with 2 cores and 18s in one with 4 cores. All of those gains by simply moving your computations from streams to Flow. We plan to benchmark on machines with over 40 cores soon.

We are very excited with the possibilities GenStage brings to developers and all new paths it allows us to explore and research. So give it a try and let us know! [GenStage, Flows, and more will also be the topic of my keynote at ElixirConf 2016](http://www.elixirconf.com/) and we hope to see you there.

Finally, we want to thank the [akka-streams and reactive-streams projects](http://reactive-streams.io) which provided us guidance in implementing the demand-driven exchange between stages as well as the [Apache Spark](http://spark.apache.org/) and [Apache Beam](http://beam.incubator.apache.org/) initiatives that inspire the work behind `GenStage.Flow`.

Happy coding!
