---
layout: getting-started
title: IO and the file system
---

# {{ page.title }}

{% include toc.html %}

This chapter is a quick introduction to input/output mechanisms and file-system-related tasks, as well as to related modules like [`IO`](/docs/stable/elixir/IO.html), [`File`](/docs/stable/elixir/File.html) and [`Path`](/docs/stable/elixir/Path.html).

We had originally sketched this chapter to come much earlier in the getting started guide. However, we noticed the IO system provides a great opportunity to shed some light on some philosophies and curiosities of Elixir and the <abbr title="Virtual Machine">VM</abbr>.

## The `IO` module

The `IO` module is the main mechanism in Elixir for reading and writing to standard input/output (`:stdio`), standard error (`:stderr`), files and other IO devices. Usage of the module is pretty straightforward:

```iex
iex> IO.puts "hello world"
hello world
:ok
iex> IO.gets "yes or no? "
yes or no? yes
"yes\n"
```

By default, functions in the IO module read from the standard input and write to the standard output. We can change that by passing, for example, `:stderr` as an argument (in order to write to the standard error device):

```iex
iex> IO.puts :stderr, "hello world"
hello world
:ok
```

## The `File` module

The [`File`](/docs/stable/elixir/File.html) module contains functions that allow us to open files as IO devices. By default, files are opened in binary mode, which requires developers to use the specific `IO.binread/2` and `IO.binwrite/2` functions from the `IO` module:

```iex
iex> {:ok, file} = File.open "hello", [:write]
{:ok, #PID<0.47.0>}
iex> IO.binwrite file, "world"
:ok
iex> File.close file
:ok
iex> File.read "hello"
{:ok, "world"}
```

A file can also be opened with `:utf8` encoding, which tells the `File` module to interpret the bytes read from the file as UTF-8-encoded bytes.

Besides functions for opening, reading and writing files, the `File` module has many functions to work with the file system. Those functions are named after their UNIX equivalents. For example, `File.rm/1` can be used to remove files, `File.mkdir/1` to create directories, `File.mkdir_p/1` to create directories and all their parent chain. There are even `File.cp_r/2` and `File.rm_rf/1` to respectively copy and remove files and directories recursively (i.e., copying and removing the contents of the directories too).

You will also notice that functions in the `File` module have two variants: one "regular" variant and another variant with a trailing bang (`!`). For example, when we read the `"hello"` file in the example above, we use `File.read/1`. Alternatively, we can use `File.read!/1`:

```iex
iex> File.read "hello"
{:ok, "world"}
iex> File.read! "hello"
"world"
iex> File.read "unknown"
{:error, :enoent}
iex> File.read! "unknown"
** (File.Error) could not read file unknown: no such file or directory
```

Notice that when the file does not exist, the version with `!` raises an error. The version without `!` is preferred when you want to handle different outcomes using pattern matching:

```elixir
case File.read(file) do
  {:ok, body}      -> # do something with the `body`
  {:error, reason} -> # handle the error caused by `reason`
end
```

However, if you expect the file to be there, the bang variation is more useful as it raises a meaningful error message. Avoid writing:

```elixir
{:ok, body} = File.read(file)
```

as, in case of an error, `File.read/1` will return `{:error, reason}` and the pattern matching will fail. You will still get the desired result (a raised error), but the message will be about the pattern which doesn't match (thus being cryptic in respect to what the error actually is about).

Therefore, if you don't want to handle the error outcomes, prefer using `File.read!/1`.

## The `Path` module

The majority of the functions in the `File` module expect paths as arguments. Most commonly, those paths will be regular binaries. The [`Path`](/docs/stable/elixir/Path.html) module provides facilities for working with such paths:

```iex
iex> Path.join("foo", "bar")
"foo/bar"
iex> Path.expand("~/hello")
"/Users/jose/hello"
```

Using functions from the `Path` module as opposed to just manipulating binaries is preferred since the `Path` module takes care of different operating systems transparently. Finally, keep in mind that Elixir will automatically convert slashes (`/`) into backslashes (`\`) on Windows when performing file operations.

With this we have covered the main modules that Elixir provides for dealing with IO and interacting with the file system. In the next sections, we will discuss some advanced topics regarding IO. Those sections are not necessary in order to write Elixir code, so feel free to skip them, but they do provide a nice overview of how the IO system is implemented in the <abbr title="Virtual Machine">VM</abbr> and other curiosities.

## Processes and group leaders

You may have noticed that `File.open/2` returns a tuple like `{:ok, pid}`:

```iex
iex> {:ok, file} = File.open "hello", [:write]
{:ok, #PID<0.47.0>}
```

That happens because the `IO` module actually works with processes (see [chapter 11](/getting-started/processes.html)). When you write `IO.write(pid, binary)`, the `IO` module will send a message to the process identified by `pid` with the desired operation. Let's see what happens if we use our own process:

```iex
iex> pid = spawn fn ->
...>  receive do: (msg -> IO.inspect msg)
...> end
#PID<0.57.0>
iex> IO.write(pid, "hello")
{:io_request, #PID<0.41.0>, #Reference<0.0.8.91>, {:put_chars, :unicode, "hello"}}
** (ErlangError) erlang error: :terminated
```

After `IO.write/2`, we can see the request sent by the `IO` module (a four-elements tuple) printed out. Soon after that, we see that it fails since the `IO` module expected some kind of result that we did not supply.

The [`StringIO`](/docs/stable/elixir/StringIO.html) module provides an implementation of the `IO` device messages on top of strings:

```iex
iex> {:ok, pid} = StringIO.open("hello")
{:ok, #PID<0.43.0>}
iex> IO.read(pid, 2)
"he"
```

By modelling IO devices with processes, the Erlang <abbr title="Virtual Machine">VM</abbr> allows different nodes in the same network to exchange file processes in order to read/write files in between nodes. Of all IO devices, there is one that is special to each process: the **group leader**.

When you write to `:stdio`, you are actually sending a message to the group leader, which writes to the standard-output file descriptor:

```iex
iex> IO.puts :stdio, "hello"
hello
:ok
iex> IO.puts Process.group_leader, "hello"
hello
:ok
```

The group leader can be configured per process and is used in different situations. For example, when executing code in a remote terminal, it guarantees messages in a remote node are redirected and printed in the terminal that triggered the request.

## `iodata` and `chardata`

In all of the examples above, we used binaries when writing to files. In the chapter ["Binaries, strings and char lists"](/getting-started/binaries-strings-and-char-lists.html), we mentioned how strings are simply bytes while char lists are lists with code points.

The functions in `IO` and `File` also allow lists to be given as arguments. Not only that, they also allow a mixed list of lists, integers and binaries to be given:

```iex
iex> IO.puts 'hello world'
hello world
:ok
iex> IO.puts ['hello', ?\s, "world"]
hello world
:ok
```

However, this requires some attention. A list may represent either a bunch of bytes or a bunch of characters and which one to use depends on the encoding of the IO device. If the file is opened without encoding, the file is expected to be in raw mode, and the functions in the `IO` module starting with `bin*` must be used. Those functions expect an `iodata` as argument; i.e., they expect a list of integers representing bytes and binaries to be given.

On the other hand, `:stdio` and files opened with `:utf8` encoding work with the remaining functions in the `IO` module. Those functions expect a `char_data` as an argument, that is, a list of characters or strings.

Although this is a subtle difference, you only need to worry about these details if you intend to pass lists to those functions. Binaries are already represented by the underlying bytes and as such their representation is always "raw".

This finishes our tour of IO devices and IO related functionality. We have learned about four Elixir modules - [`IO`](/docs/stable/elixir/IO.html), [`File`](/docs/stable/elixir/File.html), [`Path`](/docs/stable/elixir/Path.html) and [`StringIO`](/docs/stable/elixir/StringIO.html) - as well as how the <abbr title="Virtual Machine">VM</abbr> uses processes for the underlying IO mechanisms and how to use `chardata` and `iodata` for IO operations.
