module.exports = {
  devServer: {
    port: 8080,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  configureWebpack: {
    output: {
      filename: 'js/[name].[hash].js'
    }
  },
  lintOnSave: false
};
