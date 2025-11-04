module.exports = {
  configureWebpack: {
    output: {
      library: 'MfeComponents',
      libraryExport: 'default',
      libraryTarget: 'umd'
    }
  },
  css: {
    extract: false
  },
  lintOnSave: false
};
