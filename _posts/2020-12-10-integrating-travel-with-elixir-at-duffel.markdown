---
layout: post
title: Integrating travel with Elixir at Duffel
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Duffel.
logo: /images/cases/logos/duffel.png
tags: api integration xml
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

[Duffel](https://duffel.com/) is building the new software backbone of the travel industry. Their first product is the Flights API, a developer-friendly platform that enables any business to instantly search flights, make bookings, reserve seats, and sell paid extras like checked bags. Duffel is connected to more than 20 of the world’s largest airlines, including American Airlines, Emirates, and Lufthansa. The company was founded in November 2017 and in 2019 it opened a private beta of their API and has raised $56M total in funding. It now has 40 employees across its offices in London and New York. This article discusses how Duffel has used Elixir as their technology of choice to modernize an industry built on old standards and outdated stacks. If you are interested in shaping the future of travel, [Duffel is hiring](https://duffel.com/careers).

![Duffel](/images/cases/bg/duffel.png)

## Why Elixir?

Today, to access flights and prices from airlines, companies have to go through a Global Distribution System (GDS), often using decades-old systems such as Amadeus and Sabre. Steve Domin, Duffel's founder / CEO, explains: "The airline industry runs on a legacy data exchange standard called [EDIFACT standard](https://en.wikipedia.org/wiki/EDIFACT) and only recently moved to a ‘modern’ SOAP/XML world. Any integration work with a GDS or an airline is always scheduled to take months, and this creates a very high barrier to entry for new businesses."

At its heart, Duffel is building the new operating system for travel. A single request to Duffel's API may translate into a chain of dozens of requests to different airlines. The response of each request needs to be parsed, normalized, and potentially be hydrated with more outgoing requests. All of this while managing slow responses, timeouts, large data payloads, and more. These challenges made it clear to Steve that Elixir would be a great fit: "We are building a highly concurrent platform with intensive data trafficking. From day one, it was clear the Erlang VM would be a great fit, as it was designed for telecommunication with similar requirements in mind." They chose the Erlang VM, alongside [the Phoenix web framework](https://phoenixframework.org/) and [the Ecto database library](https://github.com/elixir-ecto/ecto) as their stack to launch their initial JSON API. They leverage Elixir's standard library for most of their concurrent work and [the Saxy library for XML parsing](https://github.com/qcam/saxy).

## Growing with Open Source

When Steve co-founded the company in November 2017, he already had plenty of experience with Elixir. Steve started using the language before it reached 1.0, back in 2013. He started his journey by hacking on [Dynamo](https://github.com/devinus/dynamo), Phoenix's ancestor, and eventually introduced Elixir at his previous company, by using it for an internal project. He also organized meet-ups in London and contributed to Open Source projects, including some of his own, such as [Swoosh](https://github.com/swoosh/swoosh).

The founders joined [Y Combinator](https://www.ycombinator.com/) in Summer 2018. Once they came back to London, they hired Alan Kennedy as their first engineer. Alan first heard about Elixir when he and Steve were colleagues at GoCardless. Alan kept an eye on it but never actively used it until he joined Duffel. Alan recalls struggling to jump from a language that promotes mutability to an immutable language like Elixir. Once everything clicked, he acknowledged the new programming model is conceptually much simpler.

Since then, the company has grown with a mixture of fresh and experienced engineers, including nearly 70% of the engineering organisation programming in Elixir.

Johanna Larsson is one of the most recent engineers to join Duffel. She had already spoken at Elixir Conferences and made meaningful contributions to the ecosystem, such as [the HexDiff project](https://diff.hex.pm/), before she was hired. In her opinion, one of Elixir's biggest assets is the community, which she considers welcoming and supportive.

Duffel has often been able to leverage the ecosystem and reach out to existing solutions. However, they don't shy away from creating their own and open-sourcing them whenever it makes sense. Overall, the Duffel team has contributed to many areas of the ecosystem. Besides the previously mentioned Swoosh and HexDiff projects, their team members created [Hammox](https://github.com/msz/hammox), [Bigflake](https://github.com/stevedomin/bigflake), the company's own [Paginator](https://github.com/duffelhq/paginator/) library, and others.

## Upcoming challenges

Duffel engineers have many interesting and exciting challenges ahead of them. For example, as more developers start using the product, they will begin to hit some rate-limits imposed by airlines that they haven't yet exercised. As one would expect, different airlines have different rules and various constraints, and providing a unified solution has its hurdles.

Some of the upcoming improvements are related to their usage of umbrella projects. Duffel started as a monolith, but they eventually migrated to Elixir's umbrella projects - a mono-repo implementation within Elixir's tooling - as soon as Phoenix v1.4 was released. Their primary motivation was to separate the communication with different airlines into different services. In the beginning, the services were clear in Steve's head, but as the team grew, they experienced friction enforcing those boundaries, which led to cyclic dependencies.

Luckily, Elixir v1.11 started emitting warnings for cyclic and undeclared dependencies between applications, which forced the Duffel team to revisit the areas that were not strict in the past to increase the quality of the codebase in the long term.

The team is also always exploring how to improve their APIs by bringing new approaches and technologies, such as streaming and GraphQL, as well as intelligent ways to optimize their integrations. If you are interested in tackling these and many other challenges while reshaping the travel industry, you can [learn more about Duffel's engineering opportunities](https://duffel.com/careers).
