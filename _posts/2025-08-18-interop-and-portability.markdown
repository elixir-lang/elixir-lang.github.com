---
layout: post
title: "Interoperability in 2025: beyond the Erlang VM"
authors:
- Wojtek Mach
- José Valim
category: Announcements
excerpt: "We explore the mechanisms for interoperability and portability between Elixir, other programming languages, and runtimes."
---

The Erlang Virtual Machine has, historically, provided three main options for interoperability with other languages and ecosystems, with different degrees of isolation:

* [NIFs (Native Implemented Functions)](https://www.erlang.org/doc/apps/erts/erl_nif.html) integrate with third party code in the same memory space via C bindings. This translates to low overhead and best performance but it also means faulty code can bring the whole Virtual Machine down, bypassing some of Erlang's fault-tolerance guarantees

* [Ports](https://www.erlang.org/doc/system/ports.html) start a separate Operating System process to communicate with other languages through STDIN/STDOUT, guaranteeing process isolation. In a typical Erlang fashion, ports are fully evented, concurrent, and distributed (i.e. you can pass and communicate with ports across nodes)

* [Distributed nodes](https://www.erlang.org/doc/apps/erts/erl_dist_protocol.html) rely on Erlang well-defined distribution and serialization protocol to communicate with other runtimes. Any language can implement said protocol and act as an Erlang node, giving you full node isolation between runtimes

Those mechanisms have led to multiple integrations between Elixir and other programming languages, such as Zig and Rust, and more recently C++, Python, and Swift, which we will explore here.

Furthermore, alternative implementations of the Erlang VM and Elixir have brought a fourth category of **interoperability through portability**: where your Elixir program runs in a completely different environment to leverage its native capabilities, libraries, and ecosystem, while maintaining Elixir's syntax and semantics (either partially or fully). This opens up some exciting new possibilities and since this approach is still relatively uncharted territory, let's dive into it first.

## Portability

The [AtomVM](https://atomvm.org) is a lightweight implementation of the Erlang VM that can run on constrained environments, such as microcontrollers with just a few hundred kilobytes of memory such as ESP32, STM32 or Pico. AtomVM supports a functional subset of Erlang VM  and its standard library, all optimized to run on tiny microcontrollers.

Given its low footprint, AtomVM can also target WebAssembly, paving the way to run Elixir in web browsers and alternative WASM runtimes in the future. The [Popcorn](https://popcorn.swmansion.com) project, [recently announced at ElixirConf EU 2025](https://www.youtube.com/watch?v=ep--rQO1FRI), builds on those capabilities to provide better interoperability between Elixir and JavaScript.

### Popcorn

[Popcorn](https://popcorn.swmansion.com) is a library for running Elixir in web browsers, with JavaScript interoperability. Popcorn brings an extensive subset of Elixir semantics into the browser and, although it is in its infancy, it is already capable of [running interactive Elixir code entirely client side](https://popcorn.swmansion.com/demos/eval).

And here is a quick example showing how to communicate with JavaScript from WASM:

```elixir
defmodule HelloPopcorn do
  use GenServer

  @process_name :main

  def start_link(args) do
    GenServer.start_link(__MODULE__, args, name: @process_name)
  end

  @impl true
  def init(_init_arg) do
    Popcorn.Wasm.register(@process_name)
    IO.puts("Hello console!")

    Popcorn.Wasm.run_js("""
    () => {
      document.body.innerHTML = "Hello from WASM!";
    }
    """)

    :ignore
  end
end
```

Popcorn could help with Elixir adoption by making it really easy to create interactive guides with executable code right there in the browser. And once it's production ready, it could enable offline, local-first applications, entirely in Elixir.

### Hologram

[Hologram](https://hologram.page) is a full-stack isomorphic Elixir web framework that runs on top of Phoenix. It lets developers create dynamic, interactive web applications entirely in Elixir.

Hologram transpiles Elixir code to JavaScript and provides a complete framework including templates, components, routing, and client-server communication for building rich web applications.

Here is a snippet of a Hologram component that handles drawing events entirely client-side, taken from the official [SVG Drawing Demo](https://hologram.page/demos/svg-drawing):

```elixir
defmodule DrawingBoard do
  use Hologram.Component

  def init(_props, component, _server) do
    put_state(component, drawing?: false, path: "")
  end

  def template do
    ~HOLO"""
    <svg
      class="cursor-crosshair touch-none bg-black w-[75vw] h-[75vh]"
      $pointer_down="start_drawing"
      $pointer_move="draw_move"
      $pointer_up="stop_drawing"
      $pointer_cancel="stop_drawing"
    >
      <path d={@path} stroke="white" stroke-width="2" fill="none" />
    </svg>
    """
  end

  def action(:draw_move, params, component) when component.state.drawing? do
    new_path = component.state.path <> " L #{params.event.offset_x} #{params.event.offset_y}"
    put_state(component, :path, new_path)
  end

  def action(:start_drawing, params, component) do
    new_path = component.state.path <> " M #{params.event.offset_x} #{params.event.offset_y}"
    put_state(component, drawing?: true, path: new_path)
  end
end
```

While Popcorn runs on a lightweight implementation of the Erlang VM with all of its primitives, Hologram works directly on the Elixir syntax tree. They explore distinct paths for bringing Elixir to the browser and are both in active development.

## Native Implemented Functions (NIFs)

NIFs allow us to write performance-critical or system-level code and call it directly from Erlang and Elixir as if it were a regular function.

NIFs solve practical problems like improving performance or using all Operating System capabilities. NIFs run in the same Operating System process as the VM, the same memory space. With them we can use third-party native libraries, execute syscalls, interface with the hardware, etc. On the other hand, using them can forgo some of Erlang's stability and error handling guarantees.

Originally, NIFs could never block and had to be written in a "yielding" fashion, which limited their applicability. Since Erlang/OTP 17, however, NIFs can be scheduled to run on separate OS threads called "dirty schedulers", based on their workloads (IO or CPU). This has directly brought Elixir and the Erlang VM into new domains, such as [Numerical Elixir](https://github.com/elixir-nx), and to interop with new languages and ecosystems.

### C

Erlang's NIFs directly target the C programming language and is used to implement low-level functionality present in Erlang's standard library:

```c
#include <erl_nif.h>

static ERL_NIF_TERM add_int64_nif(ErlNifEnv* env, int argc, const ERL_NIF_TERM argv[])
{
    int64_t a, b;
    if (!enif_get_int64(env, argv[0], &a) || !enif_get_int64(env, argv[1], &b)) {
        return enif_make_badarg(env);
    }
    return enif_make_int64(env, a + b);
}

static ErlNifFunc nif_funcs[] = {
    {"add", 2, add_int64_nif},
};

ERL_NIF_INIT("Elixir.Example", nif_funcs, NULL, NULL, NULL, NULL)
```

Writing NIFs in C can be verbose and error-prone. Fortunately, the Elixir ecosystem offers a number of high-quality libraries that make it possible to write NIFs in other languages, let's check them out.

### C++

[Fine](https://github.com/elixir-nx/fine) is a lightweight C++ library that wraps the NIF API with a modern interface. Given the widespread use of C++ in machine learning and data, Fine aims to reduce the friction of getting from Elixir to C++ and vice-versa.

Here's the same NIF that adds two numbers in C++, using Fine:

```c++
#include <fine.hpp>

int64_t add(ErlNifEnv *env, int64_t a, int64_t b) {
  return a + b;
}

FINE_NIF(add, 0);
FINE_INIT("Elixir.Example");
```

Fine automatically encodes and decodes NIF arguments and return values based on the function signature, significantly reducing boilerplate code. It also has first-class support for Elixir structs, propagating C++ exceptions as Elixir exceptions, and more.

### Rust

[Rustler](https://github.com/rusterlium/rustler) is a library for writing NIFs in Rust. The goal is to make it impossible to crash the VM when using "safe" Rust code. Furthermore, Rustler makes it easy to encode/decode Rust values to and from Elixir terms while safely and ergonomically managing resources.

Here's an example NIF implemented with Rustler:

```rust
#[rustler::nif]
fn add(a: i64, b: i64) -> i64 {
  a + b
}

rustler::init!("Elixir.Example");
```

### Zig

[Zigler](https://hexdocs.pm/zigler) lets us write NIFs in Zig, a low-level programming language designed for maintaining robust, optimal, and reusable software. Zig removes hidden control flow, implicit memory allocation, and similar abstractions in favour of code that's explicit and predictable.

Zigler compiles Zig code at build time and exposes it directly to Elixir, without external build scripts or glue. It tightly integrates with Elixir tooling: Zig code is formatted via `mix format` and documentation written in Zig appears in IEx via the `h` helper.

Here's an example NIF in Zig:

```elixir
iex> Mix.install([:zigler])
iex> defmodule Example do
       use Zig, otp_app: :zigler

       ~Z"""
       pub fn add(a: i64, b: i64) i64 {
         return a + b;
       }
       """
     end
iex> Example.add(1, 2)
3
```

We can write NIFs directly in IEx sessions, scripts, Livebook notebooks, and similar! And with Zig's excellent interop with C, it's really easy to experiment with native code on the Erlang VM.

### Python

[Pythonx](https://github.com/livebook-dev/pythonx) runs a Python interpreter in the same OS process as your Elixir application, allowing you to evaluate Python code and conveniently convert between Python and Elixir data structures. Pythonx also integrates with the [uv](https://docs.astral.sh/uv/) package manager, automating the management of Python and its dependencies.

One caveat is that Python's Global Interpreter Lock (GIL) prevents multiple threads from executing Python code at the same time so calling Pythonx from multiple Elixir processes does not provide concurrency we might expect and can become source of bottlenecks. However, GIL is a constraint for regular Python code only. Packages with CPU-intense functionality, such as `numpy`, have native implementation of many functions and invoking those releases the GIL (GIL is also released when waiting on I/O).

Here's an example of using `numpy` in Elixir:

```elixir
iex> Mix.install([{:pythonx, "~> 0.4.0"}])
iex> Pythonx.uv_init("""
     [project]
     name = "myapp"
     version = "0.0.0"
     requires-python = "==3.13.*"
     dependencies = [
       "numpy==2.2.2"
     ]
     """)
iex> import Pythonx, only: :sigils
iex> x = 1
iex> ~PY"""
     import numpy as np

     a = np.int64(x)
     b = np.int64(2)
     a + b
     """
#Pythonx.Object<
  np.int64(3)
>
```

[Livebook](https://livebook.dev) uses Pythonx to allow Elixir and Python code cells to co-exist in the same notebook (and in the same memory space), with low-overhead when transferring data between them.

## Distributed nodes

Elixir, by way of Erlang, has built-in support for distributed systems. Multiple nodes can connect over a network and communicate using message passing, with the same primitives such as `send` and `receive` used for both local and remote processes.

Nodes become discoverable in the cluster simply by starting them with names. Once we connect to a node, we can send messages, spawn remote processes, and more. Here's an example:

```elixir
$ iex --name a@127.0.0.1 --cookie secret
$ iex --name b@127.0.0.1 --cookie secret
iex(a@127.0.0.1)> Node.connect(:"b@127.0.0.1")
iex(a@127.0.0.1)> node()
:"a@127.0.0.1"
iex(a@127.0.0.1)> :erpc.call(:"b@127.0.0.1", fn -> node() end)
:"b@127.0.0.1"
```

While Distributed Erlang is typically used for Erlang-Erlang communication, it can be also used for interacting with programs written in other programming languages. Erlang/OTP includes [Erl_Interface](https://www.erlang.org/doc/apps/erl_interface), a C library for writing programs that can participate in the Erlang cluster. Such programs are commonly called C nodes.

Any language may implement these protocols from scratch or, alternatively, use `erl_interface` as its building block. For example, Erlang/OTP ships with [Jinterface](https://www.erlang.org/doc/apps/jinterface) application, a Java library that lets JVM programs act as distributed Erlang nodes. Another recent example is the [Swift Erlang Actor System](https://github.com/otp-interop/swift-erlang-actor-system), for communicating between Swift and Erlang/Elixir programs.

## Ports

Last but not least, ports are the basic mechanism that Elixir/Erlang uses to communicate with the outside world. Ports are the most common of interoperability across programming languages, so we will only provide two brief examples.

In Elixir, the `Port` module offers a low-level API to start separate programs. Here's an example that runs `uname -s` to print the current operating system:

```elixir
iex> port = Port.open({:spawn, "uname -s"}, [:binary])
iex> flush()
{#Port<0.3>, {:data, "Darwin\n"}}
iex> send(port, {self(), :close})
iex> flush()
{#Port<0.3>, :closed}
:ok
```

Most times, however, developers use `System.cmd/3` to invoke short-running programs:

```elixir
iex> System.cmd("uname", ["-s"])
{"Darwin\n", 0}
```

## Summary

This article highlights many of the several options for interoperating with Elixir and the Erlang Virtual Machine. While it does not aim to be a complete reference, it covers integration across a range of languages, such as Rust, Zig, Python and Swift, as well as portability to different environments, including microcontrollers and web browsers.
