const baseConfig = require('./webpack.common')
const { merge } = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const webpack = require('webpack')
const PurgeCSSPlugin = require('purgecss-webpack-plugin')
const resolveApp = require('./paths')
const glob = require('glob')
const CompressionPlugin = require('compression-webpack-plugin')
// var InlineChunkHtmlPlugin = require('inline-chunk-html-plugin');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(baseConfig(true), {
  mode: 'production',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{
        from: 'public',
        to: 'public',
        globOptions: {
          ignore: ['**/index.html']
        }
      }]
    }),
    new MiniCssExtractPlugin({ // css单独拆分为文件
      filename: 'css/[name].[hash:6].css'
    }),
    new webpack.optimize.ModuleConcatenationPlugin(), // 作用域提升，提升性能
    new PurgeCSSPlugin({
      paths: glob.sync(`${resolveApp('./src')}/**/*`, { nodir: true })
    }),
    new CompressionPlugin({
      test: /\.(css|js)$/i,
      algorithm: 'gzip'
    })
    // new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime/]) // 将一定大小文件直接注入 html,
  ],
  optimization: {
    chunkIds: 'deterministic', // 文件名称尽可能短，也会是序号类型
    splitChunks: {
      chunks: 'all',
      minSize: 20000, // 拆分的每个包不小于20kb
      maxSize: 20000, // 体积大于设置的值的包要去拆分开包
      minChunks: 1, // 包如果要拆分，则必须要至少引用一次
      cacheGroups: {
        syVendors: {
          test: /[\\/]node_modules[\\/]/, // 对目录内文件进行单独打包拆分，且放入一个文件中 vender
          filename: 'js/[id]_verdor.js', // 最终名字
          priority: -10 // 都满足时候的优先级，越高月用
        }
      }
    },
    minimizer: [
      new CssMinimizerPlugin()
    ]
  }
})
