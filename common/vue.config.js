const path = require("path");

/** @type {import("@vue/cli-service").ProjectOptions} */
module.exports = ({
  assetsDir: "assets",
  filenameHashing: false,
  // pages: {
  //   index: {
  //     // entry for the page
  //     entry: 'src/main.js',
  //     // the source template
  //     template: 'public/index.html',
  //     // output as dist/index.html
  //     filename: 'index.html',
  //     // when using title option,
  //     // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
  //     title: 'Microfrontend Shell App',
  //     // chunks to include on this page, by default includes
  //     // extracted common chunks and vendor chunks.
  //     chunks: ['chunk-vendors', 'chunk-common', 'app']
  //   },
  //   state: {
  //     // entry for the page
  //     entry: 'src/state.js',
  //     // the source template
  //     template: 'public/index.html',
  //     // output as dist/index.html
  //     filename: 'state.html',
  //     // when using title option,
  //     // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
  //     title: 'Microfrontend Shell App - State',
  //     // chunks to include on this page, by default includes
  //     // extracted common chunks and vendor chunks.
  //     chunks: ['chunk-vendors', 'chunk-common', 'state']
  //   },
  //   // template is inferred to be `public/subpage.html`
  //   // and falls back to `public/index.html` if not found.
  //   // Output filename is inferred to be `subpage.html`.
  //   // subpage: 'src/subpage/main.js'
  // },
  devServer: {
    port: 8080,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  configureWebpack: {
    entry: {
      main: "./src/main.js",
      state: "./src/state.js",
    },
    optimization: {
      chunkIds: "named",
      splitChunks: {
        cacheGroups: {
          commons: {
            chunks: "initial",
            minChunks: 2,
            maxInitialRequests: 5, // The default limit is too small to showcase the effect
            minSize: 0 // This is example is too small to create commons chunks
          },
          vendor: {
            test: /node_modules/,
            chunks: "initial",
            name: "vendor",
            priority: 10,
            enforce: true
          }
        }
      }
    },
    output: {
      path: path.join(__dirname, "dist"),
      filename: (chunkdata) => {
        return "js/[name].js";
      }
    },
  },
  lintOnSave: false
});
