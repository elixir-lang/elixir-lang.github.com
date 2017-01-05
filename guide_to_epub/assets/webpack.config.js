var webpack = require('webpack')

var output = {
  filename: 'app.js'
}

var loaders = [{
  test: /\.js$/,
  exclude: /(node_modules|bower_components)/,
  loader: 'babel',
  query: {
    presets: ['es2015']
  }
}]

module.exports = {
  development: {
    debug: true,
    devtool: 'eval-source-map',
    output: output,
    module: {
      loaders: loaders
    }
  },
  production: {
    output: output,
    module: {
      loaders: loaders
    },
    plugins: [
      new webpack.optimize.DedupePlugin()
    ]
  }
}
