---
layout: post
title: PaaS with Elixir at Heroku
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Heroku.
logo: /images/cases/logos/heroku.png
tags: paas phoenix
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

[Heroku](https://www.heroku.com) provides services and tools to build, run, and scale web applications. They enable developers and teams to focus on the design and craft of their apps. Heroku started development back in 2007, focused on the Ruby programming language, and since then, they have expanded to support multiple runtimes, either officially or via buildpacks.

As the platform grew, their engineering teams also adopted different languages, one of them being Elixir. In this article, we will talk about how two distinct engineering teams at Heroku, the Front-end team and the Vault team, have adopted Elixir.

![Heroku](/images/cases/bg/heroku.png)

## First steps with Elixir

The Vault team was first to use Elixir inside Heroku. Their team is responsible for licensing and financial services, such as invoicing, credit card payments, etc. Most of their services are used internally at Heroku.

They had to rewrite one of their existing services and that was the perfect occasion to give Elixir a try, since the difficulties and risks with the service were mostly known. The experiment was a success: they deployed and ran their first Elixir application in production. This paved the way to use Elixir more and more.

Later on, they had a new challenge: they had to audit a large amount of data, and they knew from experience that the Ruby implementation would take too long to finish. Given they were already ramping up their familiarity with Elixir, they chose to apply [Elixir's GenStage](https://github.com/elixir-lang/gen_stage) to the problem, which is a low-level library for data processing, and that took only a couple hours. From this moment on, they were sold on the language and the platform.

## Tackling operational complexity with Elixir

The Front-end team shares a similar story: they first used Elixir to solve a well-understood problem and took it forward from there.

The Front-end engineers are responsible for maintaining all user interfaces: the CLI, the dashboard, and a bunch of backend services that work with data. One of the features they provide to Heroku customers is analytics.

At first, they were sending their analytics to Mixpanel. However, they had some issues fetching the data, due to cross-domain concerns, and they decided to replace Mixpanel by an in-house Elixir service. The service used [Plug](https://github.com/elixir-plug/plug), a library for building web applications, and had a single endpoint.

<blockquote style="font-size: 24px; color: #444">
<p>We were having a lot of fun and a lot of luck with it, so we kept doing it.</p>
<p style="font-size: 20px">— Micah Woods, Lead Engineer, on migrating to Elixir.</p>
</blockquote>

They later spent most of a year focused on operational stability, and during this period, they started rewriting part of their Node.js microservices into Elixir. Today they have migrated their numerous Node.js microservices into one main Elixir application with one auxiliary service for authentication. The fact that Elixir was capable of handling everything they threw at it alongside their experience with Erlang's stability - [Heroku's router uses Erlang](https://blog.heroku.com/erlang-in-anger) - allowed them to simplify their operations considerably.

## Productivity and scalability

The Front-end team has been using Elixir for two years. The team has 21 engineers: about 4 of them doing Elixir full-time, and 8 engineers altogether doing Elixir here and there.

The first service that they built with Elixir, the analytics services, receives requests and puts them into an in-memory queue to be processed within the same VM. It handles about 3k to 4k requests per second. 99% of the response times stay within 0-1ms, occasionally 4ms. They use 3 Heroku dynos for fault-tolerance - of course, Heroku uses Heroku for their own infrastructure.

The main Elixir application uses [the Phoenix web framework](https://phoenixframework.org/) to power the Heroku Dashboard, provide real-time functionality via WebSockets, and support other services. This application runs on 5 Heroku dynos - although their engineering team believes they could probably do with less. Memory consumption is also on the lower side: their biggest dyno uses 256MB.

The Vault team doing Elixir is only three engineers. Most of their apps are used internally, so they are generally not worried about performance. They continue using Elixir because <strong>they feel productive and happy with it</strong>. They have also found it is an easier language to maintain compared to their previous experiences.

## On Phoenix

Both teams generally use Phoenix for web applications, unless they have a reason not to, which is rare. They acknowledge there is not a performance penalty for using Phoenix and you get a lot out of the box. Phoenix makes it easy to opt-in on the pieces that they need and remove the parts that they don't want.

They have also found it easier to understand how Phoenix itself works under the hood, especially compared to their previous experiences with other frameworks, such as Ruby on Rails. This knowledge is consistently helping them maintain and update their applications as time passes.

## Learning Elixir and growing the team

The growth of both Elixir teams has been mostly organic. Given there are multiple languages in their stack, they often hire for one or another language in particular, and not specifically for Elixir. If the new team members gravitate towards Elixir, they are further encouraged to explore and learn the language. They are also active practitioners of pair programming, so there are many opportunities in their team to learn from each other, rotate pairs, swap projects, and so on.

According to Matthew Peck, "the paradigm shift from Object-Oriented languages to Functional Programming was our biggest challenge when first learning Elixir". However, the team agrees the investment was worth it: "Learning Elixir has made us better programmers. We have found that immutability made our code more readable, easier to test, and simpler to make concurrent. Now when we go back to an Object-Oriented language, we are thinking about how we can apply the same concepts there" - said Mike Hagerdon.

Amanda Dolan added some remarks on Elixir's capabilities for writing concurrent and fault-tolerant applications: "One other challenge when learning Elixir is fully grasping concurrency and the Erlang/OTP patterns". Some of them felt it took longer to master those concepts than they first expected.

Taylor Mock has his take on the challenges teams may face when adopting Elixir: "Another difference between Elixir and our previous stacks, Ruby and Node.js, is in the ecosystems". They were initially concerned that the Elixir ecosystem would lack when it comes to third-party tools, but that was not what they saw. Taylor continues: "We found out that we can get really far with the concepts and mechanisms that the language itself provides. This shift can be scary, but we are now past it, and we find ourselves with leaner applications and fewer dependencies".

Overall, both teams found the language itself quite approachable. Given they started with a small proof of concept, they were able to tackle their concerns in regards to adoption, development, and deployment as they moved forward. Historically Heroku also has had much success with Erlang, and that has contributed to the success adopting Elixir has seen inside Heroku.
