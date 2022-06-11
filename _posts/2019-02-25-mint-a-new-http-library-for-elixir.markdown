---
layout: post
title: Mint, a new HTTP client for Elixir
author: Eric Meadows-Jönsson
category: Announcements
excerpt: Mint is a new low-level HTTP client that aims to provide a small and functional core that others can build on top.
---

[Mint](https://github.com/ericmj/mint) is a new low-level HTTP client that aims to provide a small and functional core that others can build on top. Mint is connection based: each connection is a single struct with an associated socket belonging to the process that started the connection. Since no extra processes are started for the connection, you can choose the process architecture that better fits your application.

To validate this we built out the library with a common API supporting both HTTP/1 and HTTP/2 with automatic version negotiation. In addition, Mint comes with a [CA certificate store](https://github.com/ericmj/castore) to do safe by default HTTPS connections.

## Connections without processes

Mint HTTP connections are managed directly in the process that starts the connection, which means no connection pool is used nor new processes spawned when a connection is opened. This allows the user of the library to build their own process structure that fits their application.

With Mint each connection has a single immutable data structure that the user needs to manage. Mint uses ["active mode"](http://www.erlang.org/doc/man/inet.html#setopts-2) sockets. This means data and events from the socket are sent as messages to the process that started the connection. The user passes the messages to the `stream/2` function that returns the updated connection and a list of "responses". Responses are streamed back which means you won't receive a single full HTTP response back from `stream/2`, instead the response is returned in partial response chunks. A chunk can be the status line, HTTP headers, or part of the response body.

Let's look at an example of sending a request with Mint:

```elixir
iex(1)> {:ok, conn} = Mint.HTTP.connect(:http, "httpbin.org", 80)
iex(2)> {:ok, conn, request_ref} = Mint.HTTP.request(conn, "GET", "/", [], "")
iex(3)> receive do
...(3)>   message ->
...(3)>     IO.inspect(message, label: :message)
...(3)>     {:ok, conn, responses} = Mint.HTTP.stream(conn, message)
...(3)>     IO.inspect(responses, label: :responses)
...(3)> end
message: {:tcp, #Port<0.8>, "HTTP/1.1 200 OK\r\n" <> ...}
responses: [
  {:status, #Reference<...>, 200},
  {:headers, #Reference<...>, [{"connection", "keep-alive"}, ...},
  {:data, #Reference<...>, "<!DOCTYPE html>" <> ...},
  {:done, #Reference<...>}
]
```

As we can see all calls to `Mint.HTTP` functions return an updated `conn` which holds the state for the connection. It is important to carry on the `conn` to the next function call or the state will be corrupted.

On line 2 we send a request to the server. A reference to the request is returned: this reference is useful when sending concurrent requests, either with HTTP/1 pipelining or with HTTP/2 multiplexed streams.

Next we start a receive block waiting for a TCP active mode message and pass it to `stream/2`. The message is parsed and the response to the request is returned. As you can see the response is split over multiple tuples: `:status`, `:headers`, `:data`, and `:done`. This is because Mint was built from the ground with streaming in mind. The parts of the response will be returned continuously as TCP messages are passed to `stream/2` so that we don't have to wait for the full response to complete before starting to process it.

If the response body is larger than a single packet `stream/2` may return multiple `:data` tuples and if the response includes trailing headers multiple `:headers` will be returned. When the response is complete `:done` will be returned.

Note that if you send concurrent requests on a HTTP/2 connection responses can be returned interleaved from the requests using HTTP/2's stream multiplexing. Additionally, responses can be spread over multiple messages so we may need to continually receive messages and pass them to `stream/2`.

See more examples on how to use Mint in the [documentation](https://hexdocs.pm/mint).

## Why process-less?

Mint may seem more cumbersome to use than most other HTTP libraries you have used and that is true in many ways. But by providing a low-level API without a predetermined process architecture it gives more flexibility to the user of the library.

Many times you do not need a general purpose connection pool and can avoid the additional complexity, single point of failure, and potential performance bottlenecks that it brings. For example, if you are building quick CLI scripts, you most likely don't need a pool and performing a single one-off request with Mint is good enough.

Another good use case for Mint is [GenStage](https://github.com/elixir-lang/gen_stage). If you write GenStage pipelines, it is most likely that you have a pool of producers that fetch data from external sources via HTTP. If you are using a high-level HTTP library, that comes with its own pool, now you have two pools, one of GenStage producers and another from the HTTP library. With Mint, you can have each GenStage producer manage its own connection, reducing overhead and simplifying the code.

Of course, none of this stops you from building a connection pool on top of Mint. The point is exactly that Mint won't impose an architecture onto you. At the end of the day, we hope Mint will be a useful building block for more complex scenario and use cases.

## HTTP/1 and HTTP/2

The `Mint.HTTP` module has a single interface for both HTTP/1 and HTTP/2 connections and performs version negotiation on HTTPS connections, HTTP connections default to HTTP/1. You can specify which HTTP version you want to use or use the `Mint.HTTP1` or `Mint.HTTP2` modules directly if you want to use version-specific features.

## Safe-by-default HTTPS

When connecting over HTTPS, Mint will perform certificate verification by default. We believe it's crucial that an HTTP library defaults to be secure out of the box.

Mint uses an optional dependency on [CAStore](https://github.com/ericmj/castore) to provide certificates from [Mozilla's CA Certificate Store](https://www.mozilla.org/en-US/about/governance/policies/security-group/certs/).

You can of course tweak specific SSL settings without re-building the safe defaults yourself.

## Current state of the library

The first version of Mint has just been released. It is an experimental library trying a new approach to building HTTP libraries so don't expect a fully stable API yet.

Use Mint to explore new ideas for HTTP connection management and building higher level clients on top of Mint. In the future connection pooling and a higher level API may be added to supplement the current low level API, either directly to Mint or via different libraries.

*Note:* Mint is being announced in the official Elixir blog because it was originally being considered for inclusion in Elixir itself. However, at some point the Elixir team decided it doesn't make sense to include an HTTP client in Elixir itself, at least as long as Erlang/OTP ships with a client too. Mint is not maintained by the Elixir team, although it is maintained by Eric and Andrea, who are part of the team.
