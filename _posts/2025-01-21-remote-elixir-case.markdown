---
layout: post
title: "Remote: growing from zero to unicorn with Elixir"
author: Hugo Baraúna
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Remote.
logo: /images/cases/logos/remote.png
tags: growth team web
---

*Welcome to our series of [case studies about companies using Elixir in production](/cases.html).*

Remote is the everywhere employment platform enabling companies to find, hire, manage, and pay people anywhere across the world.

Founded in 2019, they reached unicorn status in just over two years and have continued their rapid growth trajectory since.

Since day zero, Elixir has been their primary technology. Currently, their engineering organization as a whole consists of nearly 300 individuals.

This case study focuses on their experience using Elixir in a high-growth environment.

![Remote website screenshot](/images/cases/bg/remote.png)

## Why Elixir?

Marcelo Lebre, co-founder and president of Remote, had worked with many languages and frameworks throughout his career, often encountering the same trade-off: easy-to-code versus easy-to-scale.

In 2015, while searching for alternatives, he discovered Elixir. Intrigued, Marcelo decided to give it a try and immediately saw its potential. At the time, Elixir was still in its early days, but he noticed how fast the community was growing, with support for packages and frameworks starting to show up aggressively.

In December 2018, when Marcelo and his co-founder decided to start the company, they had to make a decision about the technology that would support their vision. Marcelo wanted to prioritize building a great product quickly without worrying about scalability issues from the start. He found Elixir to be the perfect match:

> I wanted to focus on building a great product fast and not really worry about its scalability. Elixir was the perfect match—reliable performance, easy-to-read syntax, strong community, and a learning curve that made it accessible to new hires.
>
> \- 	Marcelo Lebre, Co-founder and President

The biggest trade-off Marcelo identified was the smaller pool of Elixir developers compared to languages like Ruby or Python. However, he quickly realized that the quality of candidates more than made up for it:

> The signal-to-noise ratio in the quality of Elixir candidates was much higher, which made the trade-off worthwhile.
>
> \- 	Marcelo Lebre, Co-founder and President

## Growing with a monolithic architecture

Remote operates primarily with a monolith, with Elixir in the backend and React in the front-end.

The monolith enabled speed and simplicity, allowing the team to iterate quickly and focus on building features. However, as the company grew, they needed to invest in tools and practices to manage almost 180 engineers working in the same codebase.

One practice was boundary enforcement. They used the [Boundary library](https://github.com/sasa1977/boundary) to maintain strict boundaries between modules and domains inside the codebase.

Another key investment was optimizing their compilation time in the CI pipeline. Since their project has around 15,000 files, compiling it in every build would take too long. So, they implemented incremental builds in their CI pipeline, recompiling only the files affected by changes instead of the entire codebase.

> I feel confident making significant changes in the codebase. The combination of using a functional language and our robust test suite allows us to keep moving forward without too much worry.
>
> \- André Albuquerque, Staff Engineer

Additionally, as their codebase grew, the Elixir language continued to evolve, introducing better abstractions for developers working with large codebases. For example, with the release of Elixir v1.11, the [introduction of config/runtime.exs](/blog/2020/10/06/elixir-v1-11-0-released/) provided the Remote team with a better foundation for managing configuration. This enabled them to move many configurations from compile-time to runtime, significantly reducing unnecessary recompilations caused by configuration updates.

## Infra-structure and operations

One might expect Remote’s infrastructure to be highly complex, given their global scale and the size of their engineering team. Surprisingly, their setup remains relatively simple, reflecting a thoughtful balance between scalability and operational efficiency.

Remote runs on AWS, using EKS (Elastic Kubernetes Service). The main backend (the monolith) operates in only five pods, each with 10 GB of memory. They use [Distributed Erlang](https://www.erlang.org/doc/system/distributed.html) to connect the nodes in their cluster, enabling seamless communication between processes running on different pods.

For job processing, they rely on [Oban](https://github.com/oban-bg/oban), which runs alongside the monolith in the same pods.

Remote also offers a public API for partners. While this API server runs separately from the monolith, it is the same application, configured to start a different part of its supervision tree. The separation was deliberate, as the team anticipated different load patterns for the API and wanted the flexibility to scale it independently.

The database setup includes a primary PostgreSQL instance on AWS RDS, complemented by a read-replica for enhanced performance and scalability. Additionally, a separate Aurora PostgreSQL instance is dedicated to storing Oban jobs. Over time, the team has leveraged tools like PG Analyze to optimize performance, addressing bottlenecks such as long queries and missing indexes.

This streamlined setup has proven resilient, even during unexpected spikes in workload. The team shared an episode where a worker’s job count unexpectedly grew by two orders of magnitude. Remarkably, the system handled the increase seamlessly, continuing to run as usual without requiring any design changes or manual intervention.

> We once noticed two weeks later that a worker’s load had skyrocketed. But the scheduler worked fine, and everything kept running smoothly. That was fun.
>
> \- Alex Naser, Staff Engineer

## Team organization and responsibilities

Around 90% of their backend team works in the monolith, while the rest work in a few satellite services, also written in Elixir.

Within the monolith, teams are organized around domains such as onboarding, payroll, and billing. Each team owns one or multiple domains.

To streamline accountability in a huge monolith architecture, Remote invested heavily in team assignment mechanisms.

They implemented a tagging system that assigns ownership down to the function level. This means any trace—whether sent to tools like Sentry or Datadog—carries a tag identifying the responsible team. This tagging also extends to endpoints, allowing teams to monitor their areas effectively and even set up dashboards for alerts, such as query times specific to their domain.

The tagging system also simplifies CI workflows. When a test breaks, it’s automatically linked to the responsible team based on the Git commit. This ensures fast issue identification and resolution, removing the need for manual triaging.

## Hiring and training

Remote’s hiring approach prioritizes senior engineers, regardless of their experience with Elixir.

During the hiring process, all candidates are required to complete a coding exercise in Elixir. For those unfamiliar with the language, a tailored version of the exercise is provided, designed to introduce them to Elixir while reflecting the challenges they would face if hired.

Once hired, new engineers are assigned an engineering buddy to guide them through the onboarding process.

For hires without prior Elixir experience, Remote developed an internal Elixir training camp, a curated collection of best practices, tutorials, and other resources to introduce new hires to the language and ecosystem. This training typically spans two to four weeks.

After completing the training, engineers are assigned their first tasks—carefully selected tickets designed to build confidence and familiarity with the codebase.

## Summing up

Remote’s journey highlights how thoughtful technology, infrastructure, and team organization decisions can support rapid growth.

By leveraging Elixir’s strengths, they built a monolithic architecture that balanced simplicity with scalability. This approach allowed their engineers to iterate quickly in the early stages while effectively managing the complexities of a growing codebase.

Investments in tools like the Boundary library and incremental builds ensured their monolith remained efficient and maintainable even as the team and codebase scaled dramatically.

Remote's relatively simple infrastructure demonstrates that scaling doesn't always require complexity. Their ability to easily handle unexpected workload spikes reflects the robustness of their architecture and operational practices.

Finally, their focus on team accountability and streamlined onboarding allowed them to maintain high productivity while integrating engineers from diverse technical backgrounds, regardless of their prior experience with Elixir.
