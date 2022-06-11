---
layout: post
title: Embracing open data with Elixir at the Ministry of Ecological Transition in France
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at the Ministry of Ecological Transition in France.
logo: /images/cases/logos/met-france.svg
tags: open-data gov phoenix
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

A group of initiatives towards innovation and open data has given the opportunity for Elixir to play a central role in exploring, validating, and visualizing transportation data across all of France. This article will show how Elixir came to power [the National Access Point for transport data in France](https://transport.data.gouv.fr/) and explore why it continues to be an excellent fit thanks to its real-time libraries, educational tooling, and orchestration capabilities.

![Sample map of transports](/images/cases/bg/met-france.png)

## State Startups

In 2013, the French Government launched a Digital Services incubator, called [beta.gouv.fr](https://beta.gouv.fr), to spread the culture of digital innovation throughout the administration. They do this through State Startups.

State Startups are a match between a team and a mission. They help "intrapreneurs" - public servants who identify frictions and opportunities to improve the lives of their fellow citizens - tackle real-world challenges alongside a team of experts. This team of 2 to 4 people has six months to build a proof of concept ([see official website](https://beta.gouv.fr/en/)).

The insight is: instead of trying to convince other stakeholders to work towards specific goals, it is better to empower innovation and those who want to drive change. Those individuals are given a budget and the autonomy to choose the technology and assemble their team. In exchange, they must open-source and publicly document all code, costs, metrics, and statistics.

The first State Startup was [data.gouv.fr](https://www.data.gouv.fr/en), which transformed France's open data efforts from a catalog of spreadsheets into a social platform that closed the gap between the citizens consuming the data and the institutions providing them. The tool is fully [open-source](https://github.com/opendatateam/udata), allowing other countries to use it in production too.

At the time of writing, [261 State Startups](https://beta.gouv.fr/startups/) have been launched and are in various states of development.

## Elixir drives by

In 2017, a team was assembled to begin a new State Startup focused on transportation data. An incoming European delegated regulation would make it mandatory for institutions and corporations to make transportation data public. The State Startup aimed at preparing the ecosystem actors for this regulatory change.

To address this, the team decided to build a web application to search and visualize the existing transportation data available in [data.gouv.fr](https://www.data.gouv.fr). They initially targeted public transportation information provided by cities about buses, subways, and trams, all available in a static format called General Transit Feed Specification ([GTFS](https://gtfs.org/)) ([live example](https://transport.data.gouv.fr/resources/50471#visualization)).

The two developers of the team, Vincent Lara and Mauko Quiroga, had heard about Elixir and were interested in learning more. They understood it could provide a robust but flexible and fun platform to explore the problem space. So [they bootstrapped the application](https://github.com/etalab/transport-site/commit/837a048c37ac31151b51ac09432dbcbff3917de5) with the [Phoenix web framework](https://phoenixframework.org/).

As they developed the system, they spotted gaps and errors in the data available. So they began validating the data and reaching out to the institutions publishing them, providing direct feedback and value to the open data platform. The incubator saw the benefits from their contributions and, after a few months, they had a successful State Startup in their hands alongside the approval to continue working on their mission.

Between 2017 and 2021, the multi-disciplinary team (one public servant, “business developers”, and technical staff) worked to increase the coverage of published transportation data and helped cities and operators to reach their technical and regulatory goals.

## Current challenges

In 2021, the State Startup has "graduated" from its “beta gouv” incubator and is now part of France's Ministry of Ecological Transition. Now composed by Francis Chabouis, Thibaut Barrère, and Antoine Augusti, the technical part of the team is tackling new use cases and challenges as the platform grows in terms of needs and versatility.

Many of those are driven by the adoption of new data formats by governments and corporations. For example, [GTFS](https://github.com/google/transit/tree/master/gtfs/spec/en) provides a static (theoretical) itinerary: if a bus is currently delayed, this information would not be available in the feed. Enter the [GTFS-RT](https://github.com/google/transit/tree/master/gtfs-realtime/spec/en) format, where RT stands for real-time, to address those gaps. The General Bikeshare Feed Specification ([GBFS](https://nabsa.net/resources/gbfs/)) ([live example](https://transport.data.gouv.fr/datasets/velos-libre-service-creteil-cristolib-disponibilite-en-temps-reel/)) tracks bicycles, scooters, carpooling, etc. Plus the [SIRI](https://en.wikipedia.org/wiki/Service_Interface_for_Real_Time_Information) (Service Interface for Real-time Information) and [NeTEx](https://en.wikipedia.org/wiki/NeTEx) families of protocols.

Some of those formats have supporting technologies (validators, converters) written in other languages (Java, Rust, etc), which would be beneficial to integrate with. The team then realized the way forward is to adapt their Elixir system to orchestrate and coordinate those subsystems. Luckily, Elixir has shown to be exceptionally well suited to this task, thanks to the underlying Erlang Virtual Machine, designed for communication systems. Francis Chabouis expands: "We currently need to integrate with internal and external services in a variety of formats. Some are static, some require periodic pulls, and others keep open connections to push data. Elixir allows us to experiment, iterate, and scale those ideas quickly".

Overall, the data catalog now includes:

* Timetables for buses, subways, and trains, including trips and operators, as real-time updates
* Bicycle lanes and carpooling areas
* Charging and refueling stations
* Private parking areas
* Location of rental cars, scooters, bicycles, and others

Many of those formats also bring real-time concerns as they evolve the application to sample and show events as they happen. This is where the team is currently working at leveraging [Phoenix LiveView](http://github.com/phoenixframework/phoenix_live_view) to build the interactivity and functionality they need while keeping their stack simple and productive. 

The technical team has also recently grown to three developers, totaling seven members altogether. To prepare themselves for the new team members, Thibaut Barrère was responsible for upgrading their dependencies, including Elixir and Erlang, which were largely unchanged from 2017. While performing such changes can often be daunting in other stacks, Thibaut shares a very positive experience: "we did not see any breaking changes after performing long-due updates. Overall, the language and libraries seem quite stable and careful to avoid breaking changes. This experience gives us the confidence we can continue focusing on the needs of our users as we move forward".

## Open data and education

As with any other team, some challenges go beyond the technical aspects. For example, they sometimes spot companies and cities that do not make their transportation data available, which is against European Law. The team often heard concerns about making parts of their systems public, which could lead to failures in critical infrastructure.

To address this, the team built [a small Phoenix application](https://github.com/etalab/transport-site/tree/master/apps/unlock) that works as a simple proxy to those systems. The proxy caches the data for specific intervals, helping those entities address the security and traffic concerns around their critical systems. The application uses [Cachex](https://github.com/whitfin/cachex) and provides a real-time dashboard, built with LiveView, where they can configure the system, track application load, and see cache usage data.

Another area the team is actively investigating is how to make the data itself more accessible to developers who want to consume it. A non-trivial amount of work is required between fetching the city data, parsing it, and displaying it on a map, which can discourage developers from beginning their open data journey. To this end, they plan to assemble a collection of [Livebooks](http://github.com/livebook-dev/livebook), a recently released tool for writing code notebooks in Elixir that allows developers to get up and running quickly and obtain immediate feedback on their code.

Thibaut remarks how the growth of the language and its ecosystem supports their application and needs: "every time we faced a new challenge, a solution was readily available to us. When we needed to orchestrate multiple subsystems, the stack excelled at it. When we required real-time features, Phoenix and LiveView had first-class support for it. Now we need to promote education and access to open data, and Livebook is shaping to be precisely what we need".
