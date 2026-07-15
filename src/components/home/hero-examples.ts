// Shared between Hero.astro and the client-side example carousel.

export type Example = {
  title: string;
  code: string;
  precanned: { value: string; stdout?: string };
};

export const EXAMPLES: Example[] = [
  {
    title: "Code as data transformations",
    code: `"hello world"
|> String.split()
|> Enum.map(&String.capitalize/1)
|> Enum.join(" ")`,
    precanned: { value: `"Hello World"` },
  },
  {
    title: "Control-flow with pattern matching",
    code: `case Integer.parse("42px") do
  {number, "px"} -> {:pixels, number}
  {number, "pt"} -> {:points, number}
  {_number, _unit} -> {:error, :unknown_unit}
  :error -> {:error, :not_a_number}
end`,
    precanned: { value: `{:pixels, 42}` },
  },
  {
    title: "Lightweight concurrent processes",
    code: `for i <- 1..1000 do
  spawn(fn ->
    IO.puts("Hi")
  end)
end`,
    precanned: {
      value: `[1000 process identifiers]`,
      stdout: `Hi
Hi
…
Hi`,
    },
  },
  {
    title: "Distributed message passing",
    code: `parent = self()
Node.spawn(node(), fn ->
  send(parent, {:greeter, "Joe"})
end)
receive do
  {:greeter, name} -> "Hello #{name}"
end`,
    precanned: { value: `"Hello Joe"` },
  },
];
