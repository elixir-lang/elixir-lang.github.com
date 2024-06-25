---
layout: post
title: "Scaling a streaming service to hundreds of thousands of concurrent viewers at Veeps"
author: Hugo Baraúna
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Veeps.
logo: /images/cases/logos/veeps.svg
tags: streaming scaling web
---

*Welcome to our series of [case studies about companies using Elixir in production](/cases.html).*

[Veeps](https://veeps.com/) is a streaming service that offers direct access to live and on-demand events by award-winning artists at the most iconic venues. Founded in 2018, it became part of Live Nation Entertainment in 2021.

Veeps have been named [one of the ten most innovative companies in music](https://www.fastcompany.com/90848907/most-innovative-companies-music-2023) and nominated for an Emmy. They currently hold the [Guinness World Record](https://www.guinnessworldrecords.com/world-records/650975-most-tickets-sold-for-a-livestreamed-concert-by-a-solo-male-artist-current-year) for the world's largest ticketed livestream by a solo male artist—a performance where Elixir and Phoenix played an important role in the backend during the streaming.

This case study examines how Elixir drove Veeps' technical transformation, surpassing high-scale demands while keeping the development team engaged and productive.


## The challenge: scaling to hundreds of thousands of simultaneous users

Imagine you are tasked with building a system that can livestream a music concert to hundreds of thousands of viewers around the world at the same time.

In some cases, users must purchase a ticket before the concert can be accessed. For a famous artist, it’s not uncommon to see thousands of fans continuously refreshing their browsers and attempting to buy tickets within the first few minutes of the announcement.

The Veeps engineering team needed to handle both challenges.

Early on, the Veeps backend was implemented in [Ruby on Rails](https://rubyonrails.org/). Its first version could handle a few thousand simultaneous users watching a concert without any impact to stream quality, which was fine when you have a handful of shows but would be insufficient with the expected show load and massive increase in concurrent viewership across streams. It was around that time that [Vincent Franco](https://twitter.com/vinniefranco) joined Veeps as their CTO.

Vincent had an extensive background in building and maintaining ticketing and event management software at scale. So, he used that experience to further improve the system to handle tens of thousands of concurrent users. However, it became clear that improving it to *hundreds* of thousands would be a difficult challenge, requiring substantial engineering efforts and increased operational costs. The team began evaluating other stacks that could provide the out-of-the-box tooling for scaling in order to reach both short and long-term goals.


## Adopting Elixir, hiring, and rewriting the system

Vincent, who had successfully deployed Elixir as part of high-volume systems in the past, believed Elixir was an excellent fit for Veeps' requirements.

Backed by his experience and several case studies from the Elixir community, such as [the one from Discord](/blog/2020/10/08/real-time-communication-at-scale-with-elixir-at-discord/), Vincent convinced management that Elixir could address their immediate scaling needs and become a reliable foundation on which the company could build.

With buy-in from management, the plan was set in motion. They had two outstanding goals:

* Prepare the platform to welcome the most famous artists in the world.
* Build their own team of engineers to help innovate and evolve the product.

Vincent knew that hiring right-fit technical people can take time and he didn't want to rush the process. Hence, he hired [DockYard](https://dockyard.com/) to rebuild the system while simultaneously searching for the right candidates to build out the team.

Eight months later, the system had been entirely rewritten in Elixir and Phoenix. Phoenix Channels were used to enrich the live concert experience, while Phoenix LiveView empowered the ticket shopping journey.

The rewrite was put to the test shortly after with a livestream that remains one of Veeps’ biggest, still to this day. Before the rewrite, 20 Rails nodes were used during big events, whereas now, the same service requires only 2 Elixir nodes. And the new platform was able to handle 83x more concurrent users than the previous system.

The increase in infrastructure efficiency significantly reduced the need for complex auto-scaling solutions while providing ample capacity to handle high-traffic spikes.

> The rewrite marked the most extensive and intricate system migration in my career, and yet, it was also the smoothest.
>
> \- Vincent Franco, CTO


This was a big testament to Elixir and Phoenix's scalability and gave the team confidence that they made the right choice.

By the time the migration was completed, Veeps had also assembled an incredibly talented team of two backend and two frontend engineers, which continued to expand and grow the product.


## Perceived benefits of using Elixir and its ecosystem

After using Elixir for more than two years, Veeps has experienced significant benefits. Here are a few of them.


### Architectural simplicity

Different parts of the Veeps system have different scalability requirements. For instance, when streaming a show, the backend receives metadata from users' devices every 30 seconds to track viewership. This is the so-called *Beaconing service*.

Say you have 250,000 people watching a concert: the Beaconing service needs to handle thousands of requests per second for a few hours at a time. As a result, it needs to scale differently from other parts of the system, such as the merchandise e-commerce or backstage management.

To tackle this issue, they built a distributed system. They packaged each subsystem as an [Elixir release](https://hexdocs.pm/elixir/config-and-releases.html#releases), totaling five releases. For the communication layer, they used distributed Erlang, which is built into Erlang/OTP, allowing seamless inter-process communication across networked nodes.

In a nutshell, each node contains several processes with specific responsibilities. Each of these processes belongs to their respective [distributed process group](https://www.erlang.org/doc/man/pg.html). If node A needs billing information, it will reach out to any process within the "billing process group", which may be anywhere in the cluster.

When deploying a new version of the system, they deploy a new cluster altogether, with all five subsystems at once. Given Elixir's scalability, the whole system uses 9 nodes, making a simple deployment strategy affordable and practical. As we will see, this approach is well-supported during development too, thanks to the use of Umbrella Projects.


### Service-oriented architecture within a monorepo

Although they run a distributed system, they organize the code in only one repository, following the monorepo approach. To do that, they use the [Umbrella Project feature](https://hexdocs.pm/elixir/dependencies-and-umbrella-projects.html#content) from Mix, the build tool that ships with Elixir.

Their umbrella project consists of 16 applications (at the time of writing), which they [sliced into five OTP releases](https://hexdocs.pm/mix/Mix.Tasks.Release.html#module-umbrellas). The remaining applications contain code that needs to be shared between multiple applications. For example, one of the shared applications defines all the structs sent as messages across the subsystems, guaranteeing that all subsystems use the same schemas for that exchanged data.

> With umbrella projects, you can have the developer experience benefits of a single code repository, while being able to build a service-oriented architecture.
>
> \- Andrea Leopardi, Principal Engineer


### Reducing complexity with the Erlang/Elixir toolbox

Veeps has an e-commerce platform that allows concert viewers to purchase artist merchandise. In e-commerce, a common concept is a shopping cart. Veeps associates each shopping cart as a [GenServer](https://hexdocs.pm/elixir/GenServer.html), which is a lightweight process managed by the Erlang VM.

This decision made it easier for them to implement other business requirements, such as locking the cart during payments and shopping cart expiration. Since each cart is a process, the expiration is as simple as sending a message to a cart process based on a timer, which is easy to do using GenServers.

For caching, the team relies on [ETS (Erlang Term Storage)](https://www.erlang.org/doc/man/ets.html), a high-performing key-value store part of the Erlang standard library. For cache busting between multiple parts of the distributed system, they use [Phoenix PubSub](https://github.com/phoenixframework/phoenix_pubsub), a real-time publisher/subscriber library that comes with [Phoenix](https://phoenixframework.org/).

Before the rewrite, the Beaconing service used Google's Firebase. Now, the system uses [Broadway](https://elixir-broadway.org/) to ingest data from hundreds of thousands of HTTP requests from concurrent users. Broadway is an Elixir library for building concurrent data ingestion and processing pipelines. They utilized the library's capabilities to efficiently send requests to AWS services, regulating batch sizes to comply with AWS limits. They also used it to handle rate limiting to adhere to AWS service constraints. All of this was achieved with Broadway's built-in functionality.

Finally, they use [Oban](https://getoban.pro/), an Elixir library for background jobs, for all sorts of background-work use cases.

Throughout the development journey, Veeps consistently found that Elixir and its ecosystem had built-in solutions for their technical challenges. Here's what Vincent, CTO of Veeps, had to say about that:

> Throughout my career, I've worked with large-scale systems at several companies. However, at Veeps, it's unique because we achieve this scale with minimal reliance on external tools. It's primarily just Elixir and its ecosystem that empower us.
>
> \- Vincent Franco, CTO

This operational simplicity benefitted not only the production environment but also the development side. The team could focus on learning Elixir and its ecosystem without the need to master additional technologies, resulting in increased productivity.


### LiveView: simplifying the interaction between front-end and back-end developers

After the rewrite, [LiveView](https://github.com/phoenixframework/phoenix_live_view), a Phoenix library for building interactive, real-time web apps, was used for every part of the front-end except for the "Onstage" subsystem (responsible for the live stream itself).

The two front-end developers, who came from a React background, also started writing LiveView. After this new experience, the team found the process of API negotiation between the front-end and back-end engineers much simpler compared to when using React. This was because they only had to use Elixir modules and functions instead of creating additional HTTP API endpoints and all the extra work that comes with them, such as API versioning.

> Our front-end team, originally proficient in React, has made a remarkable transition to LiveView. They've wholeheartedly embraced its user-friendly nature and its smooth integration into our system.
>
> \- Vincent Franco, CTO


## Conclusion: insights from Veeps' Elixir experience

The decision to use Elixir has paid dividends beyond just system scalability. The team, with varied backgrounds in Java, PHP, Ruby, Python, and Javascript, found Elixir's ecosystem to be a harmonious balance of simplicity and power.

By embracing Elixir's ecosystem, including Erlang/OTP, Phoenix, LiveView, and Broadway, they built a robust system, eliminated the need for numerous external dependencies, and kept productively developing new features.


> Throughout my career, I've never encountered a developer experience as exceptional as this. Whether it's about quantity or complexity, tasks seem to flow effortlessly. The team's morale is soaring, everyone is satisfied, and there's an unmistakable atmosphere of positivity. We're all unequivocally enthusiastic about this language.
>
> \- Vincent Franco, CTO

Veeps' case illustrates how Elixir effectively handles high-scale challenges while keeping the development process straightforward and developer-friendly.
