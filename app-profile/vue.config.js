const packageName = 'app-profile';

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:8082/',
  configureWebpack: {
    output: {
      library: `${packageName}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${packageName}`
    }
  },
  devServer: {
    port: 8082,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  lintOnSave: false
};
