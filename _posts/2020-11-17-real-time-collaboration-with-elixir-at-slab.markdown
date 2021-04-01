---
layout: post
title: Real-time collaboration with Elixir at Slab
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Slab.
logo: /images/cases/logos/slab.png
tags: collab phoenix otp
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

[Slab](https://slab.com/) is a knowledge base and team wiki that democratizes knowledge. Jason Chen started Slab in August 2016, after picking Elixir and Phoenix as the best tools to build real-time collaborative applications. The company has grown to 6 engineers since then, distributed worldwide, and relied upon by more than 7000 companies and customers like Asana, Discord, and Glossier. If you are interested in helping companies become a source of learning and purpose, especially  during these times where remote collaboration is essential, [Slab is hiring](https://slab.com/jobs?ref=elixir).

![Slab](/images/cases/bg/slab.png)

## Why Elixir?

Slab was not the first time Jason wrote a collaborative web app. He had previous practice building them in Rails and Node.js and he believed there was a lot to improve in the development experience, especially when it came to working with WebSockets. Both technologies were also troublesome in production, as the team faced issues scaling them vertically and horizontally.

<blockquote style="font-size: 24px; color: #444">
<p>I wanted a framework with the same developer experience as Django and Rails, but one that was designed for real-time applications.</p>
<p style="font-size: 20px">— Jason Chen, CEO, on the Phoenix web framework</p>
</blockquote>

Jason doesn't consider himself a person who is always looking for new things, but he knew he would have to survey the options around him when starting Slab. During this period, he explored two main languages: Go and Elixir. In the end, Jason chose Elixir, thanks to [the Phoenix web framework](https://phoenixframework.org/): "I was looking for a framework that offered a complete toolset for building web apps. I was not interested in making low-level choices, such as which  <acronym title="Object-relational mapping">ORM</acronym> to use, which library to pick for parsing requests, etc. I wanted a framework with the same developer experience as Django and Rails, but one that was designed for real-time applications".

Jason gave himself two weeks to build a proof of concept. He wrote a collaborative blog, where multiple users could write a post simultaneously, and comments were added in real-time — all while learning Elixir and the Phoenix framework.

The trial went better than expected, and Jason's journey with Slab had officially begun.

## Growing with the platform

Shortly after, Slab was in a private beta with a handful of companies as users. For each major feature they had along the way, Elixir and Phoenix provided the building blocks for it. When they implemented real-time comments, they used Phoenix Channels and Phoenix PubSub. The pattern goes on: "for asynchronous processing, we simply use [Elixir tasks](https://hexdocs.pm/elixir/Task.html)". Later on, to track users editing a document and give each a different cursor color, they used [Phoenix Presence](https://hexdocs.pm/phoenix/Phoenix.Presence.html), a tool that no other web framework offers out-of-the-box.

Another leap in Jason's journey with Slab and Elixir was when he had to learn Erlang/OTP, a group of behaviors that ship as part of Erlang's standard library for building distributed and fault-tolerant applications.

To improve the real-time collaborative editor that is part of Slab, Jason implemented [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation). The client runs in the browser, implemented with [React](https://reactjs.org/). As users make changes to the text, their diffs are sent to the server, which arbitrates these updates and synchronizes them across the various clients.

Tackling the synchronization problem is not trivial, especially when the application is running on multiple nodes. Here is the challenge they faced. Imagine user Alice has a WebSocket connection to node X and user Bob is connected to node Y. Both Alice and Bob are working on the same text. How can Slab guarantee that changes from both users are applied, so both see the same document once done editing?

One could try to solve this problem by keeping the server stateless. Every time the server receives a diff from the client, the server would read the document from the database, apply the changes, normalize the result, and broadcast the clients' updates. With this approach, the issue is that loading the text from the database on every client update would quickly become expensive, especially as they grow in size. Response times would become higher and the user experience would degrade.

When working with Node.js, Jason tried a different approach. If Alice and Bob were writing to the same document, a load balancer would guarantee that both would be routed to the same node. After trying out both Apache and Nginx, he implemented the balancer in Node.js. The overall solution was time-consuming to get right and introduced operational complexities.

Luckily, these problems are the bread and butter of Erlang/OTP. Jason knew he needed a stateful abstraction to keep this state on the server. He had already heard about the options the platform provides, but he was unsure which one to pick. Jason recalls: "I remember asking the community if I should use an [Agent](https://hexdocs.pm/elixir/Agent.html) or a [GenServer](https://hexdocs.pm/elixir/GenServer.html) and everyone was really helpful in providing guidance." They quickly landed on GenServer as their tool of choice.

By default, both GenServer and Agents are local to each node. However, they also support the `:global` option, which registers a given name across the cluster. To use this option, they need the Erlang distribution, which they were already using for Phoenix PubSub and Presence, so this was a straight-forward change. This guarantees both Alice and Bob talk to the same GenServer, regardless if they joined node X or node Y.

Later on, when running the system in production, the platform continued to impress him. Every time they increased the machine resources, they could see the runtime efficiently using everything it had available, without changes to the code.

## Learning and tools

There are other few notable tools in Slab's stack.

Back in 2017, they migrated to GraphQL [powered by Elixir's Absinthe](http://absinthe-graphql.org/). There were concerns about adopting the query language, as it was a relatively new technology. Still, they felt it would address a real issue: they had different components in the application needing distinct data, and managing all of these possible combinations was becoming complex. This was one of the main problems GraphQL was designed to solve.

They are also running on Google Cloud with Kubernetes (K8s), and, as many Elixir engineers, they wondered [how the Erlang VM fit in a world with Docker and K8s](https://dashbit.co/blog/kubernetes-and-the-erlang-vm-orchestration-on-the-large-and-the-small). Today they run on 6 nodes, 5 of them running application code. The sixth one handles [cron jobs](https://en.wikipedia.org/wiki/Cron) and stays on standby for new deployments. They use [the peerage library](https://github.com/mrluc/peerage) to establish Distributed Erlang connections between the nodes.

<blockquote style="font-size: 24px; color: #444">
<p>We really value Elixir's ability to build complex systems using fewer moving parts. The code is simpler, and the system is easier to operate.</p>
<p style="font-size: 20px">— Sheharyar Naseer, engineer</p>
</blockquote>

Overall the Slab team aims to keep the number of dependencies low, something they believe is made possible by the platform and positively impacts onboarding new developers. Sheharyar Naseer, a member of their engineering team, explains: "We really value Elixir's ability to build complex systems using fewer moving parts. The code is simpler, and the system is easier to operate, making both experienced and new engineers more productive. We ran in production for more than 3 years without resorting to Redis. We just recently added it because we wanted our caches to survive across deployments. Many other stacks impose technologies like Redis from day one."

This approach also yields benefits when updating libraries. Sheharyar continues: "For the most part, upgrading Erlang, Elixir, and Phoenix is straight-forward. We go through the CHANGELOG, which always emphasizes the main changes we need to perform, and we have a pull request ready after one or two hours. The only time we could not upgrade immediately was when Erlang/OTP removed old SSL ciphers, which broke our HTTP client and we caught it early on during development."

When onboarding engineers, Slab recommends them different books and video courses — many of which you can find [in our learning resources page](/learning.html) — so they have the flexibility to choose a medium they are most productive with. New engineers also work on Slab itself and receive guidance through pull requests. They start with small tasks, usually in the client and GraphQL layers, and slowly tackle more complex problems around the database and Erlang/OTP. If you are interested in improving remote collaboration, [learn more about their opportunities on their website](https://slab.com/jobs?ref=elixir).
