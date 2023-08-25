---
layout: post
title: Real time communication at scale with Elixir at Discord
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Discord.
logo: /images/cases/logos/discord.png
tags: real-time genstage otp
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

Founded in 2015 by Jason Citron and Stan Vishnevskiy, [Discord](https://discord.com/) is a permanent, invite-only space for your communities and friends, where people can hop between voice, video, and text, depending on how they want to talk, letting them have conversations in a very natural or authentic way. Today, the service has over 100 million monthly active users from across the globe. Every day people spend 4 billion minutes in conversation on Discord servers, across 6.7 million active servers / communities.

From day one, Discord has used Elixir as the backbone of its chat infrastructure. When Discord first adopted the language, they were still working on building a viable business, with many questions and challenges in front of them. Elixir played a crucial role in giving them the desired technological flexibility to grow the company and also became the building block that would allow their systems to run on a massive scale.

![Discord](/images/cases/bg/discord.jpg)

## Starting technologies

Back in 2015, Discord chose two main languages to build their infrastructure: Elixir and Python. Elixir was initially picked to power the WebSocket gateway, responsible for relaying messages and real-time replication, while Python powered their API.

Nowadays, the Python API is a monolith while the Elixir stack contains 20 or so different services. These architectural choices do not represent a dichotomy between the languages but rather a pragmatic decision. Mark Smith, from the Discord team, explains it succinctly: "given the Elixir services would handle much bigger traffic, we designed them in a way where we could scale each service individually."

Discord has also explored other technologies along the way, Go and Rust being two examples, with distinct outcomes. While Discord completely phased out Go after a short foray, Rust has proven to be an excellent addition to their toolbox, boosted by its ability to play well with Elixir and Python.

## Communication at scale

Effective communication plays an essential role when handling millions of connected users concurrently. To put things into perspective, some of Discord's most popular servers, such as those dedicated to Fortnite and Minecraft, are nearing six hundred thousand users. At a given moment, it is not unlikely to encounter more than two hundred thousand active users in those servers. If someone changes their username, Discord has to broadcast this change to all connected users.

Overall, Discord's communication runs at impressive numbers. They have crossed more than 12 million concurrent users across all servers, with more than 26 million WebSocket events to clients per second, and Elixir is powering all of this.

<blockquote style="font-size: 24px; color: #444">
<p>In terms of real time communication, the Erlang VM is the best tool for the job.</p>
<p style="font-size: 20px">— Jake Heinz, Lead Software Engineer</p>
</blockquote>

When we asked their team "Why Elixir?", Jake Heinz gave a straight-forward answer: "In terms of real time communication, the Erlang VM is the best tool for the job. It is a very versatile runtime with excellent tooling and reasoning for building distributed systems". Technologically speaking, the language was a natural fit. However, Elixir was still a bet back in 2015: "Elixir v1.0 had just come out, so we were unsure in which direction the language would go. Luckily for us, we have been pleased with how the language has evolved and how the community shaped up."

## The chat infrastructure team

To power their chat messaging systems, Discord runs a cluster with 400-500 Elixir machines. Perhaps, the most impressive feat is that Discord's chat infrastructure team comprises five engineers. That's right: five engineers are responsible for 20+ Elixir services capable of handling millions of concurrent users and pushing dozens of millions of messages per second.

Discord also uses Elixir as the control plane of their audio and video services, also known as signaling, which establishes communication between users. C++ is then responsible for media streaming, a combination that altogether runs on 1000+ nodes.

The Elixir services communicate between them using Distributed Erlang, the communication protocol that ships as part of the Erlang Virtual Machine. By default, Distributed Erlang builds a fully meshed network, but you can also ask the Erlang VM to leave the job of outlining the topology up to you, by setting the aptly named `-connect_all false` flag. The Discord team sets this option to assemble a partially meshed network with [etcd](https://etcd.io/) being responsible for service discovery and hosting shared configuration.

The chat infrastructure developers are not the only ones touching the Elixir codebases. According to Mark Smith, this is an important part of Discord's culture: "We don't work in silos. So a Python developer may have to work on the Elixir services when building a new feature. We will spec out the feature together, figure out the scalability requirements, and then they will work on a pull request, which we will review and help them iterate on it."

## Community and challenges

To run at this scale, Discord learned how to leverage the Erlang VM's power, its community, and when to recognize challenges that require them to reach for their own solutions.

For example, Discord uses [Cowboy](https://github.com/ninenines/cowboy/) for handling WebSocket connections and TCP servers. To manage data bursts and provide load regulation, such as back-pressure and load-shedding, they use [GenStage](https://github.com/elixir-lang/gen_stage), which they have [discussed in detail in the past](https://discord.com/blog/how-discord-handles-push-request-bursts-of-over-a-million-per-minute-with-elixirs-genstage).

Other times, the efforts of the company and the community go hand in hand. That was the case when Discord used [the Rustler project](https://github.com/rusterlium/rustler), which provides a safe bridge between Elixir and Rust, to [scale to 11 million concurrent users](https://discord.com/blog/using-rust-to-scale-elixir-for-11-million-concurrent-users). They used the Rustler to hook a custom data structure built in Rust directly into their Elixir services.

However, the team has made abundantly clear that the powerhouse is the Erlang platform. Every time they had to push their stack forward, they never felt cornered by the technology. Quite the opposite, their engineers could always build efficient solutions that run at Discord's scale, often in a few hundred lines of code. Discord frequently gives these projects back to the community, as seen in [Manifold](https://github.com/discord/manifold) and [ZenMonitor](https://github.com/discord/zen_monitor).

The Discord team also adapted quickly when things went wrong. For instance, they attempted twice to use [Mnesia](https://www.erlang.org/doc/man/mnesia.html) in production —a database that ships as part of Erlang's standard library. They tried Mnesia in persistent and in-memory modes, and the database nodes would often fall behind in failure scenarios, sometimes being unable to ever catch up. Eventually they ditched Mnesia altogether and built the desired functionality with Erlang's builtin constructs, such as GenServer and ETS. Nowadays, they resolve these same failure scenarios within 2-3 seconds.

## Mastering Elixir

None of the chat infrastructure engineers had experience with Elixir before joining the company. They all learned it on the job. Team members Matt Nowack and Daisy Zhou report initially struggling to understand how all of their services communicate. Matt adds: "In the beginning, it was hard to accept all of the guarantees that Erlang VM provides. I'd worry about data races and concurrency issues that were impossible to happen". Eventually, they took these guarantees to heart and found themselves more productive and more capable of relying on the platform and its tools. Matt continues: "The introspection tools the Erlang VM provides is the best in class. We can look at any VM process in the cluster and see its message queue. We can use the remote shell to connect to any node and debug a live system. All of this has helped us countless times."

Running at Discord's scale adds its own dimension to mastering the language, as they need to familiarize with the abstractions for providing concurrency, distribution, and fault-tolerance. Nowadays, frameworks such as Nerves and Phoenix handle these concerns for developers, but the underlying building blocks are always available for engineers assembling their own stack, such as the Discord team.

In the end, Jake summarized how crucial Elixir and the Erlang VM have been at Discord and how it affected him personally: "What we do in Discord would not be possible without Elixir. It wouldn't be possible in Node or Python. We would not be able to build this with five engineers if it was a C++ codebase. Learning Elixir fundamentally changed the way I think and reason about software. It gave me new insights and new ways of tackling problems."
