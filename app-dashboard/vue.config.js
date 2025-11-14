const packageName = 'app-dashboard';

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:8081/',
  filenameHashing: false,
  configureWebpack: {
    output: {
      filename: 'js/app.js',
      chunkFilename: 'js/[name].js',
      library: `${packageName}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${packageName}`,
      globalObject: 'window'
    },
    optimization: {
      splitChunks: false,
      runtimeChunk: false
    }
  },
  chainWebpack(config) {
    config.optimization.delete('splitChunks');
    config.optimization.delete('runtimeChunk');
  },
  css: {
    extract: {
      filename: 'css/app.css',
      chunkFilename: 'css/[name].css'
    }
  },
  devServer: {
    port: 8081,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  lintOnSave: false
};
