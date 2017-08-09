# Elixir Lang Guides (EPUB format)

The idea behind of this application (`ElixirLangGuide`) is to offer an efficient
way to transform the [Elixir Lang guides][getting_started] into an EPUB
document.

## Using ElixirLangGuide with Mix

Your can use `ElixirLangGuide` via Mix as follows:

1. First clone and compile it:

    ```console
    $ git clone https://github.com/elixir-lang/elixir-lang.github.com
    $ cd elixir-lang.github.com/guide_to_epub
    $ mix do deps.get, compile
    ```

Now you are ready to generate your EPUB documents with `mix epub`.

To see all options available when generating docs, run `mix help epub`.

## Using ElixirLangGuide via command line

You can use `ElixirLangGuide` via the command line as follows:

1. First clone and compile it:

    ```console
    $ git clone https://github.com/elixir-lang/elixir-lang.github.com
    $ cd elixir-lang.github.com/guide_to_epub
    $ mix do deps.get, escript.build
    ```

2. Invoke the `elixir_lang_guide` executable:

    ```console
    $ ./elixir_lang_guide
    ```

### More options via command line

If you need more information about the command line options, please use the
`./elixir_lang_guide --help`:

  * `-g`, `--guide` - Guide that you want to convert, options:
    `getting_started`, `meta` or `mix_otp`, default: `getting_started`
  * `-h`, `--help` - Show help information
  * `-o`, `--output` - Output directory for the EPUB document, default: `doc`
  * `-s`, `--scripts` - List of custom JS files to include in the EPUB
    document
  * `-c`, `--styles` - List of custom CSS files to include in the EPUB
    document
  * `-v`, `--version` - Show version

[getting_started]: http://elixir-lang.org/getting-started/
