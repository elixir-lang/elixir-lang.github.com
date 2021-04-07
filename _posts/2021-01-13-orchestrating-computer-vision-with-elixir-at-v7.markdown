---
layout: post
title: Orchestrating computer vision with Elixir at V7
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at V7.
logo: /images/cases/logos/v7.png
tags: computer-vision phoenix
redirect_from: /blog/2021/01/13/orchestrating-computer-vision-with-elixir/
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

[V7](https://www.v7labs.com) is a web platform to create the sense of sight. A hub for machine learning and software engineers to develop their computer vision projects with data set management, image/video labeling, and one-click model training to automate any visual task.

Founded in 2018 by Alberto Rizzoli and Simon Edwardsson, V7 uses Elixir, Phoenix, and Cowboy to power their web platform, responsible for managing large amounts of data and orchestrating dozens of Python nodes to carry out machine learning jobs. They have [recently closed a $3M seed round](https://www.notion.so/V7-Labs-raises-3-million-to-empower-AI-teams-with-automated-training-data-workflows-2c9b36d2043e44f3b536efae0a204632), and they are currently [hiring backend engineers to augment their Elixir team](https://www.v7labs.com/working-at-v7).

![V7](/images/cases/bg/v7.png)

## Visual tasks

Throughout the years, we have been continuously automating visual tasks to speed up manual processes and reduce the rate of errors. For example:

  * Routine inspection of infrastructure: oil pipelines and offshore oil rigs require constant examination against corrosion. Once there is too much rust, it can damage the pipeline and cause leakage. Nowadays, you can use drones to take pictures and automate the detection of oxidated spots.

  * Medical examination: there is a growing use of digital pathology to assist doctors in diagnosing diseases. For example, during a biopsy of possible liver cancer, doctors use a microscope to visualize human tissue and stitch together an image of the cells, which are then individually analyzed. AI can double-check these images and help speed up problematic cells in case of positives.

  * Agriculture and farming: a wine producer may want to count grapes in a vineyard to estimate the wine production for a given season with higher precision. Farmers may use video to assess the health and the amount of exercise on free-range chickens and pigs.

  * Visual automation also plays a growing role in quality assurance and robotics: a fast-food manufacturer can use cameras to identify fries with black spots, while harvesters may use robots to pick apples from trees.

Neural networks are at the heart of these tasks, and there is a growing need to automate the creation of the networks themselves.

## Automating AI

Training a neural network for image and video classification often requires multiple steps. First, you annotate images and frames with bounded-boxes, polygons, skeletons, and many other formats. The annotations are then labeled and used to train computer vision models. Labeled annotations are also used to verify models against biases, outliers, and over/underfitting.

For many AI companies, this process exists in a loop as they continuously refine datasets and models. V7 helps teams manage and automate these steps, accelerating the creation of high-quality training data by 10-100x. Users may then export this data or use it to create neural networks directly via the platform.

<iframe width="560" height="315" style="margin: 0 auto 30px; display: block" src="https://www.youtube.com/embed/SvihDSAY4TQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

V7 uses Elixir to orchestrate all of these tasks. The front-end is a Vue.js application that talks to a [Phoenix-powered](https://phoenixframework.org/) API. The Phoenix application has to work with a large amount of data across a wide variety of formats. For example, a microscope outputs images in a different format, often proprietary, than a regular laboratory camera.

To perform all the machine learning tasks, V7 has a cluster of Python nodes orchestrated by an Elixir application running the [Cowboy](https://github.com/ninenines/cowboy/) webserver. Once a Python node comes up, it establishes a WebSocket connection with Cowboy and sends how much memory, CPU, GPU, and other relevant data it has available.

The Phoenix-powered backend communicates with the orchestrator using another Erlang VM-based technology: [RabbitMQ](https://www.rabbitmq.com/). For example, when the user tasks to auto-annotate an image, the Vue.js front-end sends a REST request to Phoenix. Phoenix then enqueues a message on RabbitMQ with the image's location, typically an Amazon S3 bucket. The orchestrator picks this message up, finds an available Python node, and delivers the relevant instructions via WebSockets.

## Ecosystem and Infrastructure

Other tools used by the V7 team are [Broadway](https://github.com/dashbitco/broadway) and the Erlang Distribution.

V7 has to process and normalize images and videos. For these, they have a separate service that receives RabbitMQ messages and invokes [ImageMagick](https://imagemagick.org/) or [FFmpeg](https://ffmpeg.org/) accordingly. They use Broadway to receive RabbitMQ messages and to execute these tasks concurrently.

The Erlang Distribution helps them broadcast information across nodes. Since they store their multimedia data on S3, they need to generate pre-signed URLs whenever the user wants to see an image or video. However, if users are routed to a different node, they would get a different URL, which would force them to download the asset again. To address this, they use the Erlang Distribution to communicate which URLs they have generated and for which purposes.

Overall, their backend runs on Amazon ECS on about four nodes, which talk directly to PostgreSQL. The largest part of their infrastructure is the Python cluster, which takes up to two dozens of machines.


## Learning and Hiring

Elixir has been present inside the company since day one, back in August 2018. Andrea Azzini, the first engineer at V7, was the one responsible for introducing it. He believed the language would be a good fit for the challenges ahead of them based on his experience running Elixir in production.

Simon Edwardsson, their CTO, had to learn the language as they developed the system, but he was able to get up and running quickly, thanks to his previous experiences with Python and Haskell. He remarks: "As a team, we were more familiar with Django, but we were concerned it would not handle well the amount of data and annotations that we manage - which could lead to rewrites or frustrations down the road. From this perspective, the investment in Elixir was worth it, as we never had to do major changes on our backend since we started."

Part of this is thanks to Phoenix's ability to provide high-level abstractions while making its building blocks accessible to developers: "While there is magic happening inside Phoenix, it is straight-forward to peek under the hood and make sense of everything."

V7 has recently welcomed a new Elixir engineer to their team, making it a total of four, and they are looking for more developers interested in joining them. Historically, more engineers have applied to their machine learning positions, but they also believe many Elixir developers are prepared but don't consider themselves ready. Simon finishes with an invitation: “We are primarily looking for backend engineers with either existing Elixir experience or willingness to learn on the job. If you are interested in automating computer vision across a large range of industries, [we welcome you to get in touch](https://www.v7labs.com/working-at-v7)."
