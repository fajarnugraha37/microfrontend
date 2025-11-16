
/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  /** @type {import('webpack').Configuration} */
  configureWebpack: {
    output: {
      library: 'MfeComponents',
      libraryExport: 'default',
      libraryTarget: 'umd',
    }
  },
  css: {
    extract: false,
    sourceMap: true,
  },
  lintOnSave: false
};
