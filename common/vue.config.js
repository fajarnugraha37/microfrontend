const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const pkg = require('./package.json');
const path = require('path');

module.exports = {
  outputDir: 'dist',
  assetsDir: 'assets',
  filenameHashing: false,

  css: {
    extract: {
      filename: 'css/[name].css',
      chunkFilename: 'css/[name].css'
    }
  },

  devServer: {
    port: 8080,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },

  configureWebpack: (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(new CleanWebpackPlugin());

    config.output = config.output || {};
    config.output.filename = (chunkData) => {
      return chunkData.chunk && chunkData.chunk.name === 'app' ? 'js/app.js' : 'js/[name].js';
    };
    config.output.chunkFilename = 'js/[name].js';

    config.optimization = config.optimization || {};
    config.optimization.chunkIds = 'named';
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendorPackages: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = (module.context || '')
              .split("node_modules")
              .pop()
              ?.split("\\")[1];
            if (packageName === pkg.name) 
              return pkg.name;
            return `vendor/${packageName}`;
          },
          chunks: 'all',
        }
      }
    };
  },

  chainWebpack: (config) => {
    config.optimization.splitChunks({
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        }
      }
    });

    const imageRule = config.module.rule('images');
    imageRule.use('url-loader').tap((options) => {
      if (options && options.fallback && options.fallback.options) {
        options.fallback.options.name = 'img/[name].[ext]';
      } else if (options) {
        options.name = 'img/[name].[ext]';
      }
      return options;
    });

    const fontsRule = config.module.rule('fonts');
    fontsRule.use('url-loader').tap((options) => {
      if (options && options.fallback && options.fallback.options) {
        options.fallback.options.name = 'fonts/[name].[ext]';
      } else if (options) {
        options.name = 'fonts/[name].[ext]';
      }
      return options;
    });
  },

  lintOnSave: false,
};
