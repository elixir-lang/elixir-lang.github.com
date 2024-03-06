---
layout: post
title: "Embedded and cloud Elixir for grid-management at Sparkmeter"
author: Hugo Baraúna
category: Elixir in Production
excerpt: A case study of how Elixir is being used at SparkMeter.
logo: /images/cases/logos/sparkmeter.png
tags: energy iot nerves
---

*Welcome to our series of case studies about companies using Elixir in production. [See all](https://elixir-lang.org/cases.html) cases we have published so far.*

[SparkMeter](https://www.sparkmeter.io/) is a company on a mission to increase access to electricity. They offer grid-management solutions that enable utilities in emerging markets to run financially-sustainable efficient, and reliable systems.

Elixir has played an important role in simplifying SparkMeter systems by providing a unified developer experience across their products. Elixir's versatility in different domains, such as embedded software, data processing, and HTTP APIs, proved to be a valuable asset to a team who aims to release robust products quickly and confidently.

Two of their products are smart electrical meters and grid-management software. These can be used to measure electricity usage, gather health information about an electrical grid, and manage billing.

Here's an overview of their architecture:

![SparkMeter architecture generation one](/images/cases/bg/sparkmeter-old-architecture.png)

The meters are embedded devices responsible for collecting measures such as electricity usage. They communicate with each other via a mesh network and also communicate with the grid edge management unit. The grid edge management unit is an embedded system that receives and processes data from up to thousands of meters. The grid edge management unit also communicates with servers running in the cloud. Those servers send and receive data to the grid edge management units and process it for use by internal systems and user-facing software.

## The challenge

The infrastructure in which their embedded devices are deployed is not reliable. The cellular network used for communication between the ground and the cloud could fail, and the electricity supply to the embedded systems could go down. Therefore, their system needed to be fault-tolerant, and they needed to build equipment that didn't require constant field maintenance.

In light of these requirements, they identified areas for improvement in the first generation of their product. One of the things they needed to improve was the development of a new grid edge management unit. Additionally, their product was mission-critical, so they wanted a technology they could confidently put into production and one that would not take more than a year of development and QA before releasing a new generation of their product.

That's when they discovered Elixir and Nerves.

## The trade-offs of adopting Elixir and Nerves
Nerves is an open-source platform that combines the Erlang virtual machine and Elixir ecosystem to build and deploy embedded systems.

When considering the adoption of Elixir and [Nerves](https://nerves-project.org/), SparkMeter recognized many advantages the technologies offered.

Elixir helped them meet the requirement of building a distributed and fault-tolerant system. That's because Elixir leverages the power of the Erlang VM and the OTP framework, which were designed with that requirement in mind.

Regarding Nerves, they saw it as an entire ecosystem for doing embedded development with many advantages. For example, it has a good story for doing local development and going from that to [deploying](https://www.nerves-hub.org/) on an embedded device. It makes it easy to connect to an embedded device for iterative development. And it also enables fine-grained control of system boot, so they can handle scenarios when certain parts of the system won't start.

That said, they had two concerns, the growth of Nerves and finding talent with expertise in the Elixir/Nerves stack.

They wanted to ensure that Nerves would continue to grow. But they realized that even if it didn't, the benefits Nerves was already offering could give them a lot of leverage. Here are's what their senior VP of engineering, Jon Thacker, had to say about that:

>  Without Nerves, we would be on our own to figure out a lot. How to do distribution, the development environment, and how to support different architectures. So it really is a batteries-included framework for doing production-grade embedded systems.
>
> \- *Jon Thacker, Senior VP of Engineering*

When we interviewed Jon for this case study, they had already been using Elixir and Nerves for more than two years. And with the benefit of hindsight, here's what he said about adopting Nerves:

> Making sure that Nerves continued to grow was a concern. But it has done so and is showing a very positive trajectory. It was a calculated risk and, as it turns out, it was the correct choice.
>
> \- *Jon Thacker, Senior VP of Engineering*

When it came to finding talent, they approached the problem in two ways. First, they started to build the pilot with a contractor to ensure that the staffing risk didn't affect their timeline. But they also wanted to have an internal team to take ownership of the product in the long term. So, shortly after finishing the first version of the new system, they hired two engineers with experience in Elixir, Michael Waud and Benjamin Milde.

Besides hiring people with previous experience in Elixir, Jon noticed that training their embedded engineers in Elixir was also a viable option. Here's what he told us about that:

> I'm traditionally an embedded engineer, and I only learned Elixir as part of this project. However, transferring my mental model was so easy that I do believe that we would be capable of training other embedded engineers as well.
>
> \- *Jon Thacker, Senior VP of Engineering*

## The new system

SparkMeter used Elixir for the ground (embedded) and cloud aspects of the new system they built. Here is an overview of the architecture:

![SparkMeter architecture generation two](/images/cases/bg/sparkmeter-new-architecture.png)

For the firmware of the grid edge management unit, they used Nerves. For the hardware, they built on top of a BeagleBone Black device.

The communication between the grid edge management unit and the meters was via radio, using Rust to manage the radio hardware module inside the grid edge management unit. They used [Elixir Ports](https://hexdocs.pm/elixir/1.13.4/Port.html) to communicate with Rust and process the data from the meters.

Elixir was also used for communication with the cloud servers via 3G or Edge. This communication required bandwidth usage optimization due to the cost of sending large volumes of data through the cellular network. They evaluated various solutions like REST, CoAP, MQTT, Kafka, and Websockets. Still, none fit their specific needs, so they created a custom protocol tailored to their use case, which involved designing a binary protocol and implementing a TCP server. Mike Waud discussed this in more detail in his talks at [ElixirConf 2021](https://www.youtube.com/watch?v=DJRL86mO4ks) and [2022](https://www.youtube.com/watch?v=BxTIUvyZHKw).

The grid edge management unit also required a local web user interface that could be accessed on-site via Wi-Fi. For this, they used Phoenix and Liveview.

The cloud aspect of the system is responsible for receiving data from the grid edge management units and sending control commands. It also runs a TCP server with their custom protocol, implemented in Elixir. The data received from the grid edge management units is stored in PostgreSQL and then consumed by a [Broadway-based](https://elixir-broadway.org/) data pipeline.

The cloud system also exposes an HTTP API implemented with Phoenix. This API is consumed by other internal systems to interact with their PostgreSQL database.

## Reaping the benefits

During and after the development of the new generation of their system, SparkMeter observed many benefits.

One of them was the reduction of the complexity of the grid edge management unit. The old version had more moving parts, using Ubuntu and Docker for the system level, Python/Celery and RabbitMQ for asynchronous processing, and Systemd for managing starting job processes.

In the new version, they replaced all of that mainly with Elixir and Nerves. And for the parts where they needed tools that were not part of the BEAM stack, they could manage them like any other BEAM process by using [Elixir Ports](https://hexdocs.pm/elixir/1.13.4/Port.html). Here's what they said about that experience:

> The new grid edge management unit has a very unified architecture. We can treat everything as an (Elixir) process. We have full control over the start and stop within a single ecosystem. It's just a very coherent storyline.
>
> \- *Jon Thacker, Senior VP Of Engineering*

Another aspect they liked about Nerves was that it included security best practices. For example, they used SSL certificates on the client and the server side for communication between the ground and the cloud. Nerves made this easy through the [NervesKey component](https://github.com/nerves-hub/nerves_key), which enables the use of a hardware security module to protect the private key. Nerves also made it easy to keep up with system security patches, as the firmware generated by Nerves is a single bundle containing a minimal Linux platform and their application packaged as a [release](https://hexdocs.pm/mix/Mix.Tasks.Release.html). Here's what they said about security in Nerves:

> It's easy enough to keep tracking upstream changes, so we're not getting behind the latest security patches. Nerves made that easy. Nerves just pushed us towards a good security model.
>
> \- *Jon Thacker, Senior VP Of Engineering*

The communication between the ground and the cloud involved implementing a custom TCP server running in both parts of the system. Network programming is not an everyday task for many application developers, but Elixir helped them a lot with that:

> I had never written a TCP client or a server before, it's just not something you even think about. But doing it in Elixir, particularly on the protocol level of sending binaries, was a pleasure to work with! Something that would be super tedious in an imperative language, with Elixir and pattern matching, is so clear!
>
> \- *Michael Waud, Senior Software Engineer*

Another benefit they received from using Elixir on the ground and in the cloud was code reuse. For example, the encoding and decoding of their custom protocol were reused for both the embedded and cloud parts.

> It would've been a much larger challenge if we hadn't been running Elixir in the cloud and on the grid edge management unit because we could write it once. The encoding and decoding we wrote once, we gained a lot from being able to share code.
>
> \- *Michael Waud, Senior Software Engineer*

Michael also pointed out that by controlling the complete connection from the grid edge management unit up to the cloud, they could reduce bandwidth usage and improve resiliency, which were essential requirements for them.

Finally, the new generation of their system also enabled them to release more often. Before, they were releasing new versions every quarter, but with the new system, they could release weekly when needed.

## Summing up

In conclusion, SparkMeter's adoption of Elixir and Nerves has led to many benefits for their mission-critical grid-management system.

Elixir was used to design elegant solutions across data processing, HTTP APIs, and within the embedded space. This unified development model led to a more productive and robust environment, with less complexity and fewer moving parts.

Additionally, the ability to control the entire connection from the ground to the cloud resulted in reduced bandwidth usage and improved resiliency. This fulfills essential requirements, given the diversity of conditions and locations the grid edge management unit may be deployed at.

The new system also allowed for more frequent releases, enabling SparkMeter to respond quickly to their business needs.