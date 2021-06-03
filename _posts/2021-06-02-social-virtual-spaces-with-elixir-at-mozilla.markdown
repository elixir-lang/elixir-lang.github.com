---
layout: post
title: Social virtual spaces with Elixir at Mozilla
author: José Valim
category: Elixir in Production
excerpt: A case study of how Elixir is being used at Mozilla.
logo: /images/cases/logos/mozilla-hubs.png
tags: virtual-spaces phoenix
---

*Welcome to our series of case studies about companies using Elixir in production. [See all cases](/cases.html) we have published so far.*

[Hubs](https://hubs.mozilla.com/) is Mozilla's take on virtual social experiences. You build your own private spaces and share them with your friends, co-workers, and community. Avatars in this space can move freely in a 3D social environment and watch videos, exchange messages, and talk to other people nearby. All you need is a browser and a microphone!

Hubs is [fully](https://github.com/mozilla/hubs) [open source](https://github.com/mozilla/reticulum) and you can host it on your infrastructure via [Hubs Cloud](https://hubs.mozilla.com/cloud). Community managers, educators, and event organizers have been using Hubs Cloud to run virtual events and online activities tailored to their specific brandings and needs. All it takes to run your own version of Hubs is one click away - which perhaps makes Hubs the most deployed Phoenix application ever!

![Mozilla Hubs](/images/cases/bg/mozilla-hubs.jpg)

## From VR to Elixir

The Hubs team started at Mozilla as the Mixed Reality team about 3.5 years ago. Their main goal was to explore ways for online social interaction via avatars and mixed reality.

They quickly focused on building their first proof of concept, where avatars could communicate, move around, and join different rooms, everything running directly in the browser. This was a significant departure from the state of the art of Virtual Reality everywhere, as the getting started experience up to this point was cumbersome and often required steep investment in the form of VR headsets.

The initial prototype was a success and it pushed the team to build a product. However, all communication in the proof of concept was peer-to-peer, which limited the features and experiences they could provide. Therefore the Hubs team knew they needed a capable backend technology to provide fan-out communication and coordinate how all different avatars interact within the virtual spaces. John Shaughnessy, Staff Software Engineer at Mozilla, comments: "When you get a lot of people in the same space, be it virtual or in the real world, there is never only a single conversation going on. Once you get ten or twenty different people in a room, conference calls don’t work well. In Hubs, people transition between multiple simultaneous conversations simply by moving around".

With this bold vision in hand, they assessed their whole stack. They settled on using JavaScript with [Three.js](https://threejs.org/) in the front-end and chose [the Phoenix web framework](https://phoenixframework.org/) for the backend. Greg Fodor, who was an Engineering Manager at Mozilla at the time, explains the choice: "We first listed all of the features we had to implement, from trivial things like REST endpoints, to more complex use cases, such as chat messaging and tracking where avatars are in the virtual world. Once I started to learn Phoenix, I saw all of those features were already there! The application we were building has to manage a large number of connections with real-time low latencies, something we knew the Erlang VM was an excellent fit for".

## In production

Hubs went live in January 2018. Almost everything in Hubs goes through Phoenix. The only exception is the WebRTC voice channels, which are handled by designated voice servers, initially implemented with [Janus](https://janus.conf.meetecho.com/) and later ported to [MediaSoup](https://mediasoup.org/). However, the Phoenix app still manages the voice servers and how connections are assigned to them.

The deployment is orchestrated by [Habitat](https://www.chef.io/products/chef-habitat/) and running on Amazon EC2. Habitat provides packaging and orchestration. When a voice server joins the Habitat ring, the Phoenix services receive a message and start assigning voices to voice servers. Overall they run on 4 Phoenix and 4 voice servers.

The Elixir experience in production has been quite smooth. Dominick D'Aniello, Staff Software Engineer at Mozilla, points out some areas they discussed improving: "the Phoenix application works mostly as a proxy, so we avoid decoding and reencoding the data unless we really need to. But sometimes we have to peek at the payloads and JSON is not the most efficient format to do so." They have also considered relying more on Elixir processes and the Erlang distribution. Dominick continues: "when a new client joins, it needs to ask all other clients what is their state in the world, what they own, and what they care about. One option is to use Elixir processes in a cluster to hold the state of the different entities and objects in the virtual world".

## Beyond Hubs

With many large companies investing in online communication, the Mozilla team saw the possibility of virtual spaces becoming walled-gardens inside existing social platforms. This led the Hubs team to work on Hubs Cloud, with the mission to commoditize virtual spaces by allowing anyone to run their own version of Hubs with a single click. 

Hubs Cloud launched in February 2020 and it has been a hit. [New York University did its graduation ceremony on a Hubs Cloud instance](https://twitter.com/nyuniversity/status/1258401916096315399). [The IEEE Virtual Reality Conference embraced Hubs](https://www.computer.org/conferences/organize-a-conference/organizer-resources/hosting-a-virtual-event/success-stories/IEEE-VR-2020) for a more accessible and sustainable event with talks and poster sessions all happening in virtual rooms, while [the Minnesota Twins baseball team launched a Virtual Hall of Fame](https://www.twincities.com/2021/02/09/twins-set-to-launch-new-virtual-fan-experience/) on top of the platform.

Their cloud version uses Amazon CloudFormation to instantiate Hubs inside the user's account. This approach brought different challenges to the Hubs team: "we want Hubs Cloud to be as affordable and straightforward as possible. The Phoenix app has already been a massive help on this front. We have also moved some features to Amazon Lambda and made them optional, such as image resizing and video conversion" - details John.

Since Hubs is also open source, developers can run their own Hubs instance in whatever platform they choose or change it however they want. That's the path Greg Fodor recently took when he announced [Jel](https://jel.app/): "Jel is the video game for work. It is a mashup of Minecraft and Discord, where everything is 3D. My goal is to spark new directions and ideas to get people excited about VR".

## Summing up

Today, the Hubs team has 10 contributors, half of whom are developers. Their engineering team is quite general and learning Elixir happens organically: "you are motivated by the feature you are working on. If it requires changing the backend, you learn Elixir with the help of the team and then make your contribution".

Overall, the bet on Phoenix was a successful one. Greg Fodor highlights: "The most significant benefit of Phoenix is in using a stack that excels at solving a large variety of problems. Once onboarded to Phoenix, there is a huge surface area our engineers can touch. Any feature they come up with, they can run with it. And because Hubs is open source, our contributors will also have the same experience. Overall, Elixir and Phoenix reduce the effort needed to cause the largest impact possible across our whole product".

Lately, they have leaned even further into the ecosystem, as they have started exposing Hubs APIs over GraphQL with the help of Absinthe. They have also migrated to Phoenix v1.5 and are using the [Phoenix LiveDashboard](https://github.com/phoenixframework/phoenix_live_dashboard) to provide metrics and instrumentation to Hubs Cloud users.
