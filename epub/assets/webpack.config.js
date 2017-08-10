var webpack = require('webpack')

var output = {
  filename: 'app.js'
}

var loaders = [{
  test: /\.js$/,
  exclude: /(node_modules|bower_components)/,
  loader: 'babel-loader',
  query: {
    presets: ['es2015']
  }
}]

module.exports = {
  development: {
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
    }
  }
}
