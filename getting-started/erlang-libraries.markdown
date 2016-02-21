---
layout: getting-started
title: Erlang libraries
---

# {{ page.title }}<span hidden>.</span>

{% include toc.html %}

Elixir provides excellent interoperability with Erlang libraries. You will not
find Elixir wrappers for libraries and applications from the Erlang standard
library in the Elixir standard library. Instead, you are encouraged to use the
Erlang libraries directly. In this section we will present some of the most
common and useful Erlang libraries that are not found in Elixir core libraries.

As you grow more proficient in Elixir, you may want to explore the Erlang 
[STDLIB Reference Manual](http://erlang.org/doc/apps/stdlib/index.html) in more
detail.




## The binary module

The built-in Elixir String module handles binaries that are encoded in utf-8
format. The binary module is useful when you are dealing with binary data that
is not necessarily utf-8 encoded.

```iex
iex> String.to_char_list "Ø"
[216]
iex> :binary.bin_to_list "Ø"
[195, 152]
```

The above example shows the difference; the `String` module returns utf-8
codepoints, while `:binary` deals with raw data bytes.

## Formatted text output

Elixir does not contain a function similar to C `printf`. An option is relying
on string interpolation that is built into the language to do this, eg.:

```iex
iex> f = Float.to_string(:math.pi, decimals: 3) |> String.rjust(10)
iex> str = "Pi is approximately given by: #{f}"
"Pi is approximately given by:      3.142"
```

Alternatively, the Erlang standard library functions `:io.format\2` and
`:io_lib.format\2` may be used. The first formats to terminal output, while the
second formats to a string. The format specifiers differ from `printf`, refer
to the Erlang documentation for details.

```iex
iex> :io.format("Pi is approximately given by:~10.3f~n", [:math.pi])
Pi is approximately given by:     3.142
:ok
iex> str = :io_lib.format("Pi is approximately given by:~10.3f~n", [:math.pi]) |> IO.iodata_to_binary
"Pi is approximately given by:     3.142\n"
```

Also note that Erlangs formatting functions require special attention to
unicode handling.

## The calendar module

The calendar module contains functions for conversion between local and
universal time, as well as time conversion functions.

```iex
iex> :calendar.day_of_the_week(1980, 6, 28)
6
iex> :calendar.now_to_local_time(:erlang.timestamp)
{{2016, 2, 17}, {22, 4, 55}}
```

## The crypto module

The crypto module contains hashing functions, digital signatures, encryption
and more. The library also contains the `crypto` application that must be
registered as a dependency to your application for some of this functionality
to work.

To do this, edit your `mix.exs` file to include:

```elixir
  def application do
    [applications: [:crypto]]
  end
```

The `crypto` module is not part of the Erlang standard library, but is included
with the Erlang distribution. The documentation is found at
[this page](http://erlang.org/doc/man/crypto.html).

```iex
iex> Base.encode16(:crypto.hash(:sha256, "Elixir"))
"3315715A7A3AD57428298676C5AE465DADA38D951BDFAC9348A8A31E9C7401CB"
```

## The digraph module

The `digraph` and `digraph_utils` modules contain functions for dealing with
directed graphs built of vertices and edges. After constructing the graph, the
algorithms in here will help finding for instance the shortest path between two
vertices, or loops in the graph.

Note that the functions in :digraph alter the graph structure indirectly as a
side effect, while returning the added vertices or edges.

Given three vertices, find the shortest path from the first to the last.

```iex
iex> digraph = :digraph.new()
iex> coords = [{0.0, 0.0}, {1.0, 0.0}, {1.0, 1.0}]
iex> for c <- coords, do: :digraph.add_vertex(digraph, c)
iex> [v0, v1, v2] = (for c <- coords, do: :digraph.add_vertex(digraph, c))
iex> :digraph.add_edge(digraph, v0, v1)
iex> :digraph.add_edge(digraph, v1, v2)
iex> :digraph.get_short_path(digraph, v0, v2)
[{0.0, 0.0}, {1.0, 0.0}, {1.0, 1.0}]
```


## Erlang Term Storage

The modules `ets` and `dets` handle storage of large data structures in memory
or on disk respectively.

ETS lets you create a table containing tuples that is owned by a single
process. For large amounts of data, ETS may be more performant than storing
data as large Elixir data structures. ETS has some functionality to be used as
a simple database or key-value store.

The functions in the `ets` module will modify the state of the table as a side
effect.

```iex
iex> table = :ets.new(:ets_test, [])
iex> :ets.insert(table, {%{name: "China", population: 1_374_000_000}})
iex> :ets.insert(table, {%{name: "India", population: 1_284_000_000}})
iex> :ets.insert(table, {%{name: "USA", population: 322_000_000}})
iex> :ets.i(table)
<1   > {#{name => <<"USA">>,population => 322000000}}
<2   > {#{name => <<"China">>,population => 1374000000}}
<3   > {#{name => <<"India">>,population => 1284000000}}
```

ETS is described in more detail in it's own section.

## The math module

The `math` module contains common mathematical operations covering trigonometry,
exponential and logarithmic functions.

```iex
iex> angle_45_deg = :math.pi() * 45.0 / 180.0
iex> :math.sin(angle_45_deg)
0.7071067811865475
iex> :math.exp(55.0)
7.694785265142018e23
iex> :math.log(7.694785265142018e23)
55.0
```


## The queue module

The `queue` is a data structure that allows efficient FIFO (first in first out)
operation.

A regular Elixir list may not be performant as removing the first element in
the list requires building a new list with the remaining elements, not reusing
any data.

```iex
iex> q = :queue.new
iex> q = :queue.in("A", q)
iex> q = :queue.in("B", q)
iex> q = :queue.in("C", q)
iex> {_, q} = :queue.out(q)
{{:value, "A"}, {["C"], ["B"]}}
iex> {_, q} = :queue.out(q)
{{:value, "B"}, {[], ["C"]}}
iex> {_, q} = :queue.out(q)
{{:value, "C"}, {[], []}}
iex> {_, q} = :queue.out(q)
{:empty, {[], []}}
```

## The rand module

This module has functions for returning random values and setting the random
seed.

```iex
iex> :rand.uniform()
0.8175669086010815
iex> _ = :rand.seed(:exs1024, {123, 123534, 345345})
iex> :rand.uniform()
0.5820506340260994
iex> :rand.uniform(6)
6
```

## The zlib and zip modules

The `zip` module lets you read and write zip files to and from disk or memory,
as well as extracting file information.

This code counts the number of files in a zip file:

```iex
iex> :zip.foldl(fn _, _, _, acc -> acc + 1 end, 0, :binary.bin_to_list("file.zip"))
{:ok, 633}
```

The `zlib` module deals with data compression in zlib format, as found in the
`gzip` command.

```iex
iex> song = "
...> Mary had a little lamb,
...> His fleece was white as snow,
...> And everywhere that Mary went,
...> The lamb was sure to go."
iex> compressed = :zlib.compress(song)
iex> byte_size song
110
iex> byte_size compressed
99
iex> :zlib.uncompress(compressed)
"\nMary had a little lamb,\nHis fleece was white as snow,\nAnd everywhere that Mary went,\nThe lamb was sure to go."
```

