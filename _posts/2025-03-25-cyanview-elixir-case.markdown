---
layout: post
title: "Cyanview: Coordinating Super Bowl's visual fidelity with Elixir"
authors:
- Lars Wikman
- José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Cyanview.
logo: /images/cases/logos/cyanview.png
tags: superbowl mqtt
---

How do you coordinate visual fidelity across two hundred cameras for a live event like the Super Bowl?

The answer is: by using the craft of camera shading, which involves adjusting each camera to ensure they match up in color, exposure and various other visual aspects. The goal is to turn the live event broadcast into a cohesive and consistent experience. For every angle used, you want the same green grass and the same skin tones. Everything needs to be very closely tuned across a diverse set of products and brands. From large broadcast cameras, drone cameras, and PTZ cameras to gimbal-held mirrorless cameras and more. This is what Cyanview does. Cyanview is a small Belgian company that sells products for the live video broadcast industry, and its primary focus is shading.

Broadcast is a business where you only get one chance to prove that your tool is up to the task. Reliability is king. There can be no hard failures.

A small team of three built a product so powerful and effective that it spread across the industry purely on the strength of its functionality. Without any marketing, it earned a reputation among seasoned professionals and became a staple at the world’s top live events. Cyanview's Remote Control Panel (RCP) is now used by specialist video operators on the Olympics, Super Bowl, NFL, NBA, ESPN, Amazon and many more. Even most fashion shows in Paris use Cyanview’s devices.

These devices put Elixir right in the critical path for serious broadcast operations. By choosing Elixir, Cyanview gained best-in-class networking features, state-of-the-art resilience and an ecosystem that allowed fast iteration on product features.

![Operating many displays with Cyanview products](/images/cases/bg/cyanview-4.jpg "Operating many displays with Cyanview products")

## Why Elixir?

The founding team of Cyanview primarily had experience with embedded development, and the devices they produce involve a lot of low-level C code and plenty of FPGA. This is due to the low-level details of color science and the really tight timing requirements.

If you’ve ever worked with camera software, you know it can be a mixed bag. Even after going fully digital, much of it remained tied to analog systems or relied on proprietary connectivity solutions. Cyanview has been targeting IP (as in Internet Protocol) from early on. This means Cyanview's software can operate on commodity networks that work in well-known and well-understood ways. This has aligned well with an increase in remote production, partially due to the pandemic, where production crews operate from a central location with minimal crew on location. Custom radio frequency or serial wire protocols have a hard time scaling to cross-continent distances.

This also paved the way for Elixir, as the Erlang VM was designed to communicate and coordinate millions of devices, reliably, over the network.

Elixir was brought in by the developer Ghislain, who needed to build integrations with cameras and interact with the other bits of required video gear, with many different protocols over the network. The language comes with a lot of practical features for encoding and decoding binary data down to the individual bits. Elixir gave them a strong foundation and the tools to iterate fast.

Ghislain has been building the core intellectual property of Cyanview ever since. While the physical device naturally has to be solid, reliable, and of high quality, a lot of the secret sauce ultimately lies in the massive number of integrations and huge amounts of reverse engineering. Thus, the product is able to work with as many professional camera systems and related equipment as possible. It is designed to be compatible with everything and anything a customer is using. Plus, it offers an API to ensure smooth integration with other devices.

David Bourgeois, the founder of Cyanview, told us a story how these technical decisions alongside Elixir helped them tackle real-world challenges:

"During the Olympics in China, a studio in Beijing relied on a large number of Panasonic PTZ cameras. Most of their team, however, was based in Paris and needed to control the cameras remotely to run various shows throughout the day. The problem? Panasonic’s camera protocols were never designed for internet use — they require precise timing and multiple messages for every adjustment. With network latency, that leads to timeouts, disconnects, and system failures... So they ended up placing our devices next to the cameras in Beijing and controlled them over IP from Paris — just as designed."

![Cyanview RIO device mounted on a camera at a sports field](/images/cases/bg/cyanview-2.jpg "Cyanview RIO device mounted on a camera at a sports field")

The devices in a given location communicate and coordinate on the network over a custom MQTT protocol. Over a hundred cameras without issue on a single Remote Control Panel (RCP), implemented on top of Elixir's network stack.

## Technical composition

The system as a whole consists of RCP devices running a Yocto Linux system, with most of the logic built in Elixir and C. While Python is still used for scripting and tooling, its role has gradually diminished. The setup also includes multiple microcontrollers and the on-camera device, all communicating over MQTT. Additionally, cloud relays facilitate connectivity, while dashboards and controller UIs provide oversight and control. The two critical devices are the RCP offering control on the production end and the RIO handling low-latency manipulation of the camera. Both run Elixir.

The configuration UI is currently built in Elm, but - depending on priorities - it might be converted to [Phoenix LiveView](https://phoenixframework.org/) over time to reduce the number of languages in use. The controller web UI is already in LiveView, and it is performing quite well on a very low-spec embedded Linux machine.

The cloud part of the system is very limited today, which is unusual in a world of SaaS. There are cloud relays for distributing and sharing camera control as well as forwarding network ports between locations and some related features, also built in Elixir, but cloud is not at the core of the business. The devices running Elixir on location form a cluster over IP using a custom MQTT-based protocol suited to the task and are talking to hundreds of cameras and other video devices.

It goes without saying that integration with so much proprietary equipment comes with challenges. Some integrations are more reliable than others. Some devices are more common, and their quirks are well-known through hard-won experience. A few even have good documentation that you can reference while others offer mystery and constant surprises. In this context, David emphasizes the importance of Elixir's mechanisms for recovering from failures:

"If one camera connection has a blip, a buggy protocol or the physical connection to a device breaks it is incredibly important that everything else keeps working. And this is where Elixir’s supervision trees provide a critical advantage."

## Growth & team composition

The team has grown over the 9 years that the company has been operating, but it did so at a slow and steady pace. On average, the company has added just one person per year. With nine employees at the time of writing, Cyanview supports some of the biggest broadcast events in the world.

There are two Elixir developers on board: Daniil who is focusing on revising some of the UI as well as charting a course into more cloud functionality, and Ghislain, who works on cameras and integration. Both LiveView and Elm are used to power device UIs and dashboards.

What’s interesting is that, overall, the other embedded developers say that they don't know much about Elixir and they don't use it in their day-to-day work. Nonetheless, they are very comfortable implementing protocols and encodings in Elixir. The main reason they haven’t fully learned the language is simply time — they have plenty of other work to focus on, and deep Elixir expertise hasn’t been necessary. After all, there’s much more to their work beyond Elixir: designing PCBs, selecting electronic components, reverse engineering protocols, interfacing with displays, implementing FPGAs, managing production tests, real productions and releasing firmware updates.

## Innovation and customer focus

![Operator using Cyanview RCP for a massive crowd in an arena](/images/cases/bg/cyanview-3.jpg "Operator using Cyanview RCP for a massive crowd in an arena")

Whether it’s providing onboard cameras in 40+ cars during the 24 hours of Le Mans, covering Ninja Warrior, the Australian Open, and the US Open, operating a studio in the Louvre, being installed in NFL pylons, or connecting over 200 cameras simultaneously – the product speaks for itself. Cyanview built a device for a world that runs on top of IP, using Elixir, a language with networking and protocols deep in its bones. This choice enabled them to do both: implement support for all the equipment and provide features no one else had.

By shifting from conventional local-area radio frequency, serial connections, and inflexible proprietary protocols to IP networking, Cyanview’s devices redefined how camera systems operate. Their feature set is unheard of in the industry: Unlimited multicam. Tally lights. Pan & Tilt control. Integration with color correctors. World-spanning remote production.

The ease and safety of shipping new functionality have allowed the company to support new features very quickly. One example is the increasing use of mirrorless cameras on gimbals to capture crowd shots. Cyanview were able to prototype gimbal control, test it with a customer and validate that it worked in a very short amount of time. This quick prototyping and validation of features is made possible by a flexible architecture that ensures that critical fundamentals don't break.

Camera companies that don't produce broadcast shading remotes, such as Canon or RED, recommend Cyanview to their customers. Rather than competing with most broadcast hardware companies, Cyanview considers itself a partner. The power of a small team, a quality product and powerful tools can be surprising. Rather than focusing on marketing, Cyanview works very closely with its customers by supporting the success of their events and providing in-depth customer service.

## Looking back and forward

When asked if he would choose Elixir again, David responded:

"Yes. We've seen what the Erlang VM can do, and it has been very well-suited to our needs. You don't appreciate all the things Elixir offers out of the box until you have to try to implement them yourself. It was not pure luck that we picked it, but we were still lucky. Elixir turned out to bring a lot that we did not know would be valuable to us. And we see those parts clearly now."

Cyanview hopes to grow the team more, but plans to do so responsibly over time. Currently there is a lot more to do than the small team can manage.

Development is highly active, with complementary products already in place alongside the main RCP device, and the future holds even more in that regard. Cloud offerings are on the horizon, along with exciting hardware projects that build on the lessons learned so far. As these developments unfold, we’ll see Elixir play an increasingly critical role in some of the world’s largest live broadcasts.

![Cyanview Remote Control Panels in a control room](/images/cases/bg/cyanview-1.jpg "Cyanview Remote Control Panels in a control room")

## In summary

A high-quality product delivering the right innovation at the right time in an industry that's been underserved in terms of good integration. Elixir provided serious leverage for developing a lot of integrations with high confidence and consistent reliability. In an era where productivity and lean, efficient teams are everything, Cyanview is a prime example of how Elixir empowers small teams to achieve an outsized impact.

