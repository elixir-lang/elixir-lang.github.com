import adobeLogo from "@/assets/logos/adobe.svg";
import bbcLogo from "@/assets/logos/bbc.svg";
import hcaHealthcareLogo from "@/assets/logos/hca-healthcare.svg";
import muxLogo from "@/assets/logos/mux.svg";
import plausibleLogo from "@/assets/logos/plausible.svg?url";
import remoteLogo from "@/assets/logos/remote.png";
import royalBankOfCanadaLogo from "@/assets/logos/rbc-blue.svg";
import spotifyLogo from "@/assets/logos/spotify.png";
import supabaseLogo from "@/assets/logos/supabase.svg";

export type CaseMediaEntry = {
  company: string;
  title: string;
  source: string;
  excerpt: string;
  url: string;
  logo: ImageMetadata | string;
};

export const casePodcasts: CaseMediaEntry[] = [
  {
    company: "HCA Healthcare / Waterpark",
    title: "Five Years of Perfect Uptime",
    source: "Thinking Elixir",
    excerpt:
      "A look at how Waterpark used Elixir and the BEAM to deliver five years of continuous uptime across critical healthcare systems.",
    url: "https://podcast.thinkingelixir.com/262",
    logo: hcaHealthcareLogo,
  },
  {
    company: "Spotify",
    title: "How Elixir Came to Spotify with Joel Kemp",
    source: "Thinking Elixir",
    excerpt:
      "Joel Kemp recounts introducing Elixir at Spotify to solve concurrency challenges and build support inside a large organization.",
    url: "https://podcast.thinkingelixir.com/59",
    logo: spotifyLogo,
  },
  {
    company: "Supabase Realtime",
    title: "Elixir at Supabase with Paul Copplestone",
    source: "Thinking Elixir",
    excerpt:
      "Paul Copplestone explains how Elixir, Phoenix, and PubSub power Supabase's open-source realtime platform.",
    url: "https://podcast.thinkingelixir.com/73",
    logo: supabaseLogo,
  },
  {
    company: "RBC Capital Markets",
    title: "Elixir at the Royal Bank of Canada",
    source: "Thinking Elixir",
    excerpt:
      "Thanos Vassilakis explains how Elixir and LiveView power fast, live-updating financial tools at RBC Capital Markets.",
    url: "https://podcast.thinkingelixir.com/125",
    logo: royalBankOfCanadaLogo,
  },
  {
    company: "BBC",
    title: "BEAM Scales from Nano to BBC Big",
    source: "Thinking Elixir",
    excerpt:
      "How the BBC uses Elixir to serve most of its web and mobile traffic at enormous scale.",
    url: "https://podcast.thinkingelixir.com/263",
    logo: bbcLogo,
  },
  {
    company: "Remote",
    title: "Scaling to Unicorn Status",
    source: "Thinking Elixir",
    excerpt:
      "How Remote grew an Elixir monolith to support nearly 300 engineers while scaling the company to unicorn status.",
    url: "https://podcast.thinkingelixir.com/239",
    logo: remoteLogo,
  },
  {
    company: "Mux",
    title:
      "Mux Is an API Based Platform That Lets You Process and Stream Videos",
    source: "Running in Production",
    excerpt:
      "Dylan Jhaveri shares how Mux uses Phoenix and Elixir to serve billions of video views with a zero-downtime API.",
    url: "https://runninginproduction.com/podcast/31-mux-is-an-api-based-platform-that-lets-you-process-and-stream-videos",
    logo: muxLogo,
  },
  {
    company: "Plausible Analytics",
    title: "Plausible Analytics, Elixir, and Privacy with Uku Taht",
    source: "Thinking Elixir",
    excerpt:
      "Uku Taht discusses building a privacy-first, open-source analytics business in Elixir and growing it transparently.",
    url: "https://podcast.thinkingelixir.com/105",
    logo: plausibleLogo,
  },
];

export const caseTalks: CaseMediaEntry[] = [
  {
    company: "BBC",
    title: "How Elixir Powers the BBC: From PoC to Production at Scale",
    source: "ElixirConf EU 2025",
    excerpt:
      "Ettore Berardi traces the BBC's journey from an Elixir proof of concept to infrastructure serving almost all web and app traffic.",
    url: "https://www.youtube.com/watch?v=e99QDd0_C20",
    logo: bbcLogo,
  },
  {
    company: "Frame.io / Adobe",
    title: "AI-Powered Search at Scale",
    source: "ElixirConf EU 2026",
    excerpt:
      "Jeff Weiss explores how Frame.io uses Elixir to deliver AI-powered search at scale.",
    url: "https://www.elixirconf.eu/schedule/",
    logo: adobeLogo,
  },
  {
    company: "HCA Healthcare / Waterpark",
    title: "Waterpark: Distributed Actors vs. the Pandemic",
    source: "Strange Loop 2021",
    excerpt:
      "Bryan Hunter shows how Waterpark used distributed actors, hot code loading, and Elixir to support healthcare through COVID-19.",
    url: "https://www.youtube.com/watch?v=9qUfX3XFi_4",
    logo: hcaHealthcareLogo,
  },
  {
    company: "Remote",
    title: "One Monolith, Many Teams: Growing an Org with Elixir",
    source: "ElixirConf EU 2026",
    excerpt:
      "Sofia Silva and André Albuquerque explain how 50 engineering teams contribute safely to one large Elixir monolith.",
    url: "https://www.youtube.com/watch?v=02r5xP2BgNk",
    logo: remoteLogo,
  },
  {
    company: "Supabase Realtime",
    title: "Real-time System Using Elixir — Supabase Stories",
    source: "Elixir Stream Week 2024",
    excerpt:
      "Filipe Cabaço details the clustering, messaging, and process-registration choices behind Supabase Realtime.",
    url: "https://www.youtube.com/watch?v=PVRtma5PlW4",
    logo: supabaseLogo,
  },
];
