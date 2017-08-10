# Assets

In this directory live all assets for `ElixirLangGuide`. The ready to
use built versions are found in `priv`. To change any of them read please
read the following instructions:

## Dependencies

To work on these assets you need to install [Node.js] and [npm] first (probably
as superuser or administrator). After that execute the following commands:

```bash
$ npm install -g gulp
$ npm install
```

Now many gulp tasks are available via the `gulp` command line.

## Available [gulp] tasks

If you run [gulp] without any option by default you will lint all JavaScript
files using [ESLint] and then the `build` task.

#### `build`

This will build a complete bundle, including JavaScript and CSS.

Using the flag `--type production` will result in minified JavaScript and CSS
bundles.

#### `clean`

Clean all content in the build folder `dist` for each format.

#### `javascript`

Build the JavaScript in `js` into a bundled file using [webpack] for each
format.

#### `less`

Build the [less] files in `less` into a bundled CSS file for each format.

#### `lint`

Lint all JavaScript files in `js` using [ESLint].

[Node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[gulp]: https://www.npmjs.com/package/gulp
[webpack]: http://webpack.github.io/
[less]: http://lesscss.org/
[ESLint]: http://eslint.org/
