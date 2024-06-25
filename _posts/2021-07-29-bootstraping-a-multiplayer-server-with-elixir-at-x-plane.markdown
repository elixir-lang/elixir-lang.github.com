---
layout: post
title: Bootstrapping a multiplayer server with Elixir at X-Plane
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at X-Plane.
logo: /images/cases/logos/x-plane.png
tags: multiplayer udp otp
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

[X-Plane 11](https://www.x-plane.com/) is the world's most comprehensive and powerful flight simulator for personal computers and mobile devices. X-Plane is not a game but an engineering tool created by Laminar Research that can be used to predict the flying qualities of fixed- and rotary-wing aircraft with incredible accuracy. The X-Plane franchise comes in both consumer and FAA-certifiable professional versions.

Recently, the X-Plane team took on the challenge of adding a multiplayer experience with the goal of hosting north of 10000 users in the same session. This article explores why they chose Elixir and how a team of one developer - without prior language experience - learned the language and deployed a well-received multiplayer experience in 6 months. The overall solution features a brand new open-source implementation of the RakNet communication protocol in Elixir and overperforms the original requirements when put under unexpected load.

![X-Plane](/images/cases/bg/x-plane.jpg)

## Requirements

The X-Plane team has offered peer-to-peer multiplayer in the simulator for a long time but never server-hosted multiplayer. This was a new journey for them and they had complete freedom to pick the technology stack. [According to their blog post](https://developer.x-plane.com/2021/01/have-you-heard-the-good-news-about-elixir/), their goals were:

1. To build a rock-solid server with error isolation. For example, an exception during a client update should not bring the whole server down.

2. To implement a single shared world that can scale to tens of thousands of concurrent pilots.

3. To iterate quickly: because this was the first time the Laminar Research team offered a hosted multiplayer environment, they wanted to move quickly to ship this system. This would allow users to begin flying in groups immediately and serve as a platform to gauge interest in further feature development. 

4. To be fast and consistent. Multiplayer has a "soft real-time" constraint, and they need to service _all_ clients consistently and on time. Quantitatively, this means the 99th percentile response times matter a lot more than the mean or median.

From those requirements, the need for stability and fast iteration ruled out low-level languages, even the ones in which they had plenty of in-house experience.

The need for speed and vertical scalability excluded many modern web languages, such as Ruby and Python, where the model for scaling up is generally throwing more servers at it. It was essential to avoid synchronizing state across multiple machines, which requires more development time and worsens the user experience due to the increased latency.

They eventually settled on three top contenders: Rust, Go, and Elixir. Elixir took the edge thanks to two exclusive features: fault tolerance and predictable latency. Both are built into the very core of the Erlang Virtual Machine - the robust platform that Elixir runs on. Tyler Young, X-Plane's engineer leading this implementation, highlights: "We wanted a stack that could max server capacity. We would rather run a 64-core machine than dozens of 4-core VMs. Saša Jurić's talk, [the Soul of Erlang and Elixir](https://www.youtube.com/watch?v=JvBT4XBdoUE), showed us that the concurrency model, process isolation, and partial restarts provided by the platform were the abstractions we were looking for."

## Modeling multiplayer with Elixir

Ready to give Elixir a try, Tyler picked up a couple books but soon realized the language's [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) provided the background he needed. He explains: "while the introductory guide covers the language constructs, the advanced guide on the website has you build an actual project with TCP connections, with the basic architectural patterns we would use in production."

However, instead of jumping headfirst into the multiplayer server, he decided to give Elixir a try on a smaller problem. He wrote a web proxy to the National Oceanic and Atmospheric Administration (NOAA) weather services and put it in production. This experience taught him the importance of leveraging all of the instrumentation and metrics provided by the Erlang VM. They chose [AppSignal](https://www.appsignal.com/) to help consume and digest this information.

Two weeks later, he started working on the server by implementing [the UDP-centric RakNet protocol in Elixir](https://en.wikipedia.org/wiki/RakNet). Unfortunately, there is little documentation, so they had to refer to the reference implementation in C++ most of the time. Luckily, thanks to its roots in telecommunication and network services, [Elixir and Erlang have built-in support for parsing binary packets](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#%3C%3C%3E%3E/1), which made the task a joy. The team also mapped each UDP connection to distinct lightweight threads of execution in Elixir, which we call _processes_. Elixir processes are cheap, isolated, concurrent, and are fairly scheduled by the runtime. This design allowed the X-Plane team to fully leverage the properties of robustness and predictable latency that first attracted them to the platform. Their implementation is written on top of Erlang's [gen_udp](http://www.erlang.org/doc/man/gen_udp.html) and [is open source](https://github.com/X-Plane/elixir-raknet).

Five months after choosing Elixir, they began welcoming beta testers into the server. The community's reaction was overwhelmingly positive, and the new multiplayer experience led to a strong uptick in the number of subscriptions as it went live a month later.

## Deployment and keeping it simple

At the moment, X-Plane's player base in North America is powered by a single server, running on 1 eight-core machine with 16GB of memory, although only 200MB or 300MB of memory is effectively used. Each connected player sends 10 updates a second.

For deployments, they use a blue-green strategy, alternating between two servers of the same capacity. Tyler explains: "We are aware the Erlang VM provides hot code swapping and distribution, but we are taking the simplest route whenever possible. It is much easier for us to alternate between two servers during deployments, as the servers are stable and we don't deploy frequently. Similarly, when it comes to distribution, we prefer to scale vertically or set up different servers in different regions for players across the globe."

Paul McCarty, who joined the project after launch, can attest to its simplicity: "even without prior Elixir experience, I was able to jump in and add new functionality to our HTTP APIs early on." Those APIs are built on top of [Plug](http://github.com/elixir-lang/plug) to power their chat services, provide information about connected users, and more. He concludes: "When adding new features, the server development is never the bottleneck."

Paul and Tyler finished our conversation with a curious anecdote: a couple months ago, they distributed an updated client version with debug code in it. This additional code caused each connected user to constantly ping the server every 100ms, even if not in multiplayer mode. This caused their traffic to increase 1000x! They only discovered this increase 2 weeks later when they saw the CPU usage in their Elixir server went from 5% to 21%. Once they found out the root cause and how the system handled it, they realized they didn't have to rush a client update to remove the debug code and they chose to maintain their regular release cycle. At the end of the day, it was a perfect example of the confidence they gained and built around the language and platform.
