export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Install", href: "/install/" },
  { label: "Learning", href: "/learning/" },
  { label: "Docs", href: "/docs/" },
  { label: "Case studies", href: "/cases/" },
  { label: "Blog", href: "/blog/" },
];

export const headerCta: NavItem = {
  label: "Get started",
  href: "https://hexdocs.pm/elixir/introduction.html",
  external: true,
};

export const footerColumns: { title: string; items: NavItem[] }[] = [
  {
    title: "Important links",
    items: [
      {
        label: "Hex.pm package manager",
        href: "https://hex.pm",
        external: true,
      },
      { label: "Development & team", href: "/development/" },
      {
        label: "Source code & issues tracker",
        href: "https://github.com/elixir-lang/elixir",
        external: true,
      },
      {
        label: "Erlang Ecosystem Foundation",
        href: "https://erlef.org/",
        external: true,
      },
    ],
  },
  {
    title: "Join the community",
    items: [
      {
        label: "Elixir Forum",
        href: "https://elixirforum.com",
        external: true,
      },
      {
        label: "Meetups around the world",
        href: "https://www.meetup.com/topics/elixir/",
        external: true,
      },
      {
        label: "Jobs & hiring (wiki)",
        href: "https://github.com/elixir-lang/elixir/wiki/Hiring-Elixir-Developers",
        external: true,
      },
      {
        label: "Events & resources (wiki)",
        href: "https://github.com/elixir-lang/elixir/wiki",
        external: true,
      },
      {
        label: "#elixir on irc.libera.chat",
        href: "https://web.libera.chat/#elixir",
        external: true,
      },
    ],
  },
];

export const footerSocials: NavItem[] = [
  {
    label: "Twitter / X",
    href: "https://twitter.com/elixirlang",
    external: true,
  },
  { label: "Slack", href: "https://elixir-slack.community", external: true },
  { label: "Discord", href: "https://discord.gg/elixir", external: true },
];

export const topBannerHref = "https://elixirconf.com";
