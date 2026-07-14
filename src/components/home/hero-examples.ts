// Shared between Hero.astro (which pre-highlights the code at build
// time) and the HeroCodeEditor island (which runs it).

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
    code: `case Base.decode64("SGVsbG8gUm9iZXJ0") do
  {:ok, message} ->
    message
  :error ->
    raise "wrong encoding"
end`,
    precanned: { value: `"Hello Robert"` },
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
spawn(fn -> send(parent, {:greeter, "Joe"}) end)

receive do
  {:greeter, name} -> "Hello #{name}"
end`,
    precanned: { value: `"Hello Joe"` },
  },
];
