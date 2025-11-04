const packageName = 'app-dashboard';

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:8081/',
  configureWebpack: {
    output: {
      library: `${packageName}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${packageName}`
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
