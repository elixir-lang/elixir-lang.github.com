---
layout: post
title: Growing with Elixir at Brex
author: José Valim
category: Cases
excerpt: A case study of how Elixir is being used at Brex.
---

*Welcome to our series of case studies about companies using Elixir in production. We are glad to invite Brex as our first case.*

[Brex](https://brex.com/) is reimagining financial systems so every growing company can realize their full potential. New customers can get up and running in minutes with corporate credit cards and cash management in a single, strategic account. Launched in June 2018, Brex earned a $1.1 billion valuation with the [announcement of their Series C round](https://techcrunch.com/2018/10/05/how-the-22-year-old-founders-of-brex-built-a-billion-dollar-business-in-less-than-2-years/).  By now, Brex is now valued at $2.6 billion, with Elixir at the core of their technology stack. Approximately 90% of Brex’s backend codebase is written in Elixir.

![Brex website](/images/cases/brex.png)

## Why Elixir?

Brex aims to build the next generation of B2B financial services without the restrictions of legacy technology. They choose Elixir and the Erlang VM from day one as their primary technology.

Thomas Césaré-Herriau, a Lead Engineer at Brex, has recently helped us address the reasons behind this choice: "The reliability and fault tolerance aspects of the Erlang VM are extremely appealing for building financial services. Elixir runs on the same VM, and it provides great onboarding and learning experiences to the platform, which makes Elixir a solid bet for a company like Brex."

## An evolving architecture

Brex architecture is made of approximately 40 microservices running on Kubernetes. There is a front-end application, implemented with [Phoenix](https://phoenixframework.org/) and [Absinthe](http://absinthe-graphql.org/), that interacts with those services.

Synchronous communication is done via gRPC, and Apache Kafka is used for async messages and broadcasts. However, they did not arrive at this architecture overnight, and they had many learning moments along the way.

One of their early lessons relates to the applicability of Erlang's RPC infrastructure. Although Erlang does provide RPC out-of-the-box, Erlang's built-in clustering establishes a full mesh cluster. This setup suits well when running homogenous instances, where all nodes run the same code, but it is a bad fit when building isolated microservices. The Brex team also wanted to plan for a future where they may communicate between services implemented in different languages. These requirements led them to explore more widely adopted RPC mechanisms, eventually settling on gRPC.

Brex was also one of the early adopters of gRPC in the ecosystem—which meant they had to tread through uncharted waters here and there. Nowadays, they have a well-defined set of guidelines and practices that go hand in hand with how they were able to scale the company and their Elixir teams.

## Growing the team

When Thomas joined the team, back in April 2018, there were only three backend engineers in their San Francisco office. Now, two years later, Brex has more than 100 engineers —most of them programming in Elixir - with additional offices in New York, Vancouver, and Salt Lake City.

<blockquote style="font-size: 24px; color: #444">
<p>Despite the fact that Elixir is a relatively niche language, new hires that never had contact with Elixir before are productive within three weeks</p>
<p>- Pedro Franceschi, Brex's co-founder</p>
</blockquote>

Pedro Franceschi, Brex's co-founder, [wrote about their experience when onboarding new engineers](https://medium.com/brexeng/why-brex-chose-elixir-fe1a4f313195): "Despite the fact that Elixir is a relatively niche language, new hires that never had contact with Elixir before are productive within three weeks. There are a decent amount of books/documentation available on the language that accelerate the ramp-up process."

Thomas echoed similar tones: "Getting started with Elixir is quick, but mastering Erlang/OTP takes a while." At the same time, he recognizes many frameworks available in the community, and the ones they have built internally, abstract away the concurrency and fault-tolerance concerns, allowing developers to ship reliable services rapidly.

Such quick growth comes with its challenges. Brex codebase started as an umbrella project, which is an Elixir feature for managing multiple applications in the same repository, but Thomas believes they have outgrown its capabilities. Now they’re slowly breaking their umbrella project into distinct Elixir applications. All projects still belong to a single repository (mono-repo), which has also grown to include other languages.

## The future ahead

As Brex grows, they want to make sure Elixir's adoption will scale alongside their team. As Pedro noted back in 2018, "The lack of a type system makes large-scale refactoring harder, and therefore would be a great addition to the Elixir ecosystem."

With this in mind, Brex decided to join many other companies directly investing in Elixir's future. They hired Eric Meadows-Jönsson, from the Elixir Core Team and [Hex.pm](https://hex.pm) creator, to work on Elixir and increase the amount of static checks done by the compiler. Eric concluded, "The Elixir team has been consistently improving the compiler towards this direction over the years. We introduced cross-reference checking and undefined function warnings back in Elixir v1.3. Since then many other warnings and checks were added. Elixir v1.10 introduced compilation tracers, which allows the community to listen to the compiler and run their own checks. Now we are working towards leveraging existing constructs - such as patterns, guards, and data-constructors to execute more static checks without requiring explicit developer input."
