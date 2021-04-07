---
layout: post
title: Social messaging with Elixir at Community
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Community.
logo: /images/cases/logos/community.png
tags: messaging broadway
redirect_from: /blog/2021/02/03/social-messaging-with-elixir/
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

[Community](https://community.com/) is a platform that enables instant and direct communication with the people you want to reach, using the simplicity of text messaging. Used by names like Paul McCartney, Metallica, and Barack Obama, Community connects small businesses, stars, and high-profile individuals directly to their audiences.

Community is powered by the Erlang Ecosystem, with Elixir and RabbitMQ playing central roles. This article gives an overview of the system and the tools used to handle spikes of million of users caused by events such as this tweet:

<blockquote class="twitter-tweet" data-cards="hidden"><p lang="en" dir="ltr">All right, let&#39;s try something new. If you’re in the United States, send me a text at 773-365-9687 — I want to hear how you&#39;re doing, what&#39;s on your mind, and how you&#39;re planning on voting this year. <br><br>I&#39;ll be in touch from time to time to share what&#39;s on my mind, too. <a href="https://t.co/NX91bSqbtG">pic.twitter.com/NX91bSqbtG</a></p>&mdash; Barack Obama (@BarackObama) <a href="https://twitter.com/BarackObama/status/1308769164190941187?ref_src=twsrc%5Etfw">September 23, 2020</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## The first steps with Elixir

Tomas Koci and Ustin Zarubin were the two engineers behind Community's initial implementation. The company was pivoting from a product they had written in Go and they felt the language was not expressive enough for the products they were building. So when faced with the challenge of developing a social messaging platform on top of SMS, they were open to trying a different stack.

Their first encounter with Elixir was a casual one. They were chatting about the challenges ahead of them when their roommate mentioned Elixir. Shortly after, things started to click. They both had a physics background, so they found the functional paradigm quite intuitive. The Erlang VM also has its origins in telecommunications, and they were building a telecom centric product, which gave them more confidence.

Besides the technological aspect, they also began to be active in the Elixir community. Tomas recaps: "we started attending the Elixir meetups happening here in Chattanooga. We met many developers, heard about production cases, and learned how companies like Bleacher Report were using Elixir at scale". From then on, they were sold on giving Elixir a try.

They started their prototype in January 2018, with the intent of onboarding dozens of users. They were learning Elixir while developing the system and reaching out to potential users.

Their first challenge was in May 2018, when one of their users announced his phone number, managed by Community, to millions of viewers. Tomas still remembers that day: "It was a Saturday night, around 11:00 pm when we saw an influx of users. It caught us by surprise and, after 10 hours, more than 400 thousand users had signed up". This influx of users stressed the system in unexpected ways, especially when it came to their upstream integrations. They had to patch the system to ensure they would not overload external systems or run over API limits they were required to conform to.

This event also gave them insights into the types of spikes and traffic patterns the system would have to handle at scale. Early engineering hire Jeffrey Matthias urged them to break their application into different services, making it easy to scale each service individually, and he and Tomas decided to have those services communicate via message queues.

## The next millions of users

By October 2018, the company received funding and the newly-hired engineering team of five people, began to split the original application into services that could handle sharp increases in demand and operate at scale. Shortly after, they had their next challenge in hand: Metallica had just signed up with the platform and they were going to do an early launch with their fans on Feb 1st, 2019.

The team is glad to report the announcement was a success with no hiccups on their end. They were then five backend engineers who tackled everything from architectural design and development to setting up and operating the whole infrastructure.

Community was officially unveiled in May 2019, [attracting hundreds of music stars shortly after](https://www.billboard.com/amp/articles/business/8543190/why-hundreds-music-stars-giving-fans-phone-numbers-community-app). Fourteen months later, [Barack Obama tweeted to millions his phone number powered by Community](https://twitter.com/barackobama/status/1308769164190941187).

## The current architecture

Today, more than 60 services with distinct responsibilities power Community, such as:

*   A message hub between community leaders and members
*   User data management
*   Media services (video, audio, images)
*   Systems for Community's internal team
*   Data science and machine learning
*   Billing, administration, etc

The vast majority of those services run Elixir, with Python covering the data science and machine learning endpoints, and Go on the infrastructure side.

[RabbitMQ](https://www.rabbitmq.com/) handles the communication between services. The Erlang-backed message queue is responsible for broadcasting messages and acting as [their RPC backbone](https://andrealeopardi.com/posts/rpc-over-rabbitmq-with-elixir/). Messages between services are encoded with Protocol Buffers via [the protobuf-elixir library](https://github.com/elixir-protobuf/protobuf).

Initially, they used [the GenStage library](http://github.com/elixir-lang/gen_stage/) to interface with RabbitMQ, but they have migrated to the higher level [Broadway](https://github.com/dashbitco/broadway) library over the last year. Andrea Leopardi, one of their engineers, outlines their challenges: "Our system has to handle different traffic patterns when receiving and delivering data. Incoming data may arrive at any time and be prone to spikes caused by specific events powered by actions within Communities. On the other hand, we deliver SMSes in coordination with partners who impose different restrictions on volumes, rate limiting, etc."

He continues: "both GenStage and Broadway have been essential in providing abstractions to handle these requirements. They provide back-pressure, ensure that spikes never overload the system, and guarantee we never send more messages than the amount defined by our delivery partners". As they implemented the same patterns over and over in different services, they found Broadway to provide the ideal abstraction level for them.

Their most in-demand service, the message hub, is powered by only five machines. They use [Apache Mesos](https://mesos.apache.org/) to coordinate deployments.

## Growing the team

Community's engineering team has seen stable growth over the last two years. Today they are 25 backend engineers, the majority being Elixir devs, and the company extends beyond 120 employees.

Karl Matthias, who joined early on, believes the challenges they face and the excitement for working on a new language has been positive for hiring talent. He details: "we try to hire the best production engineers we can, sometimes they know Elixir, sometimes they don't. Our team has generally seen learning Elixir as a positive and exciting experience".

The team is also happy and confident about the stability Elixir provides. Karl adds: "Elixir supervisors have our back every time something goes wrong. They automatically reestablish connections to RabbitMQ, they handle dropped database connections, etc. The system has never gone wrong to the point our infrastructure layer had to kick-in, which has been quite refreshing."

The Community team ended our conversation with a curious remark. They had just shut down their first implementation of the system, the one that received a sudden spike of four hundred thousand users on a Saturday night. Tomas concludes: "it is pretty amazing that the service we implemented while learning Elixir has been running and operating in production just fine, even after all of these milestones. And that's generally true for all of our services: once deployed, we can mostly forget about them".
