TODO: 作为个人 webpack5 的快速搭建 vue2 项目模板

## 实现思路

- 基础通用功能
  - entry 入口配置
  - output 输出配置
  - resolve 自动文件识别与简化路径配置
  - externals 排除指定依赖而减小打包体积的外部拓展配置
  - module-loader 以loader转换非js模块配置
  - plugins 全局变量、页面模板、语法工具等插件配置
  - optimization 模块抽取等性能相关配置
  - 其他相关配置

- 开发阶段配置
  - dev server 本地服务器配置
  - devtool 开发调试配置
  - proxy 接口代理转发配置
  - hot HMR模块热更新配置
  - compress gzip等压缩优化配置
  - router historyApiFallback本地路由重定向配置
  - optimization 模块名称chunkIds配置

- 生产部署阶段
  - 清理dist目录
  - 复制静态资源
  - css单独拆包
  - css/js丑化压缩
  - 作用域提升
  - tree shaking
  - 代码拆分

## 基础通用功能
    
项目打包需要依赖webpack且需要在命令行执行，因此先行安装webpck、webpack-cli到开发依赖

```js
npm i webpack webpack-cli --save-dev
```
  
安装完毕后在webpack.common.js中增加通用配置

### entry 入口配置

```js
module.exports = {
    entry: './src/main.js' // 默认是此目录，如若文件名称或者入口变更可修改
}
```

### output 输出配置

```js
const resolveApp = require('./paths')

module.exports = {
    output: {
        path: resolveApp('dist'),
        filename: 'js/[name].[hash:6].js',
        chunkFilename: 'js/[name].chunk.[hash:4].js'
    }
}
```

paths.js文件内容

```js
const path = require('path') // webpack内置模块

const appRoot = process.cwd() // 命令行运行的根目录

const resolveApp = (resolvePath) => {
  return path.resolve(appRoot, resolvePath) // 获取指定目录的完整绝对路径
}

module.exports = resolveApp
```

path：文件输出到dist目录中，根目录路径的获取通过命令行终端函数获取

filename：构建后的脚本文件输出到js目录下，且使用动态文件名称，附带文件6为hash值

chunkFilename：构建时拆分出来的chunk文件同样放入js目录下，且名称除了以上规则外，增加chunk标识

### resolve 路径简化配置

在模块源码中，通过import加载其他模块时需要写出其前缀目录地址，如若嵌套较深则会书写麻烦，此时可以配置特定路径标识映射，以简化此路径。

同时，导入其他模块时默认在文件末尾增加js文件格式结尾，其他文件格式会无法找到，配置自动补全规则来增加其他文件格式补全

```js
module.exports = {
    resolve: {
      extensions: ['.js', '.jsx', '.vue', '.json', '...'],
      alias: {
        '@': resolveApp('src')
      }
    }
}
```

resolve：通过`extensions`配置自动补全的文件类型

resolve：通过`alias`配置简化路径的映射标识

### externals 外部拓展

外部依赖的库文件如若较大且不会频繁变动，则可将库文件的导入交给外部，如使用外链形式走cdn加速、构建dll库或其他形式，通过html页面增加script脚本引入库文件

```js
module.exports = {
    externals: { // 不希望依赖打进包中，走外链cdn等
        // '$': 'Jquery',
        // react: 'React',
        // 'react-dom': 'ReactDOM',
        // 'prop-types': 'PropTypes',
        // moment: 'moment',
        // antd: 'antd',
        // classnames: 'classNames'
    }
}
```

## loaders

### vue-loader

安装

先安装vue到项目依赖，再安装vue-loader、vue-template-compiler到开发依赖

vue-template-compiler 的作用是将vue的模板代码预编译为渲染函数，以避免在运行时编译开销

```js
npm i vue --save
npm i vue-loader vue-template-compiler --save-dev
```

使用

```js
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader'
        }
      ]
    },
    plugins: [
        new VueLoaderPlugin()
    ]
}
```

安装完毕后rules内添加相应规则，检测vue结尾的文件，并使用vue-loader。同时要求单独导出vueLoaderPlugin，在plugins插件集合内实例化，以此来正确解析vue文件

### css-loader

对于样式表css的处理和其他vue、js处理不同，样式表css处理需要经过多步骤处理后才能正常使用，具体流程为：

1.使用postcss-loader将css文件内样式根据浏览器支持情况转换为多平台兼容写法，如使用autoprefixer、browserslist、caniuse-lite等依赖增加平台特性写法；

2.接着将转换后的样式表css交由css-loader处理import、url等行为，将引入和依赖的外部资源加载到当前样式表中；

3.处理完毕后将css交由style-loader，已style标签的形式注入html页面中

这里存在一个问题，开发环境时将css全部注入页面没有影响，但生产环境会是多文件大量内容，超出量后会导致首页加载变慢。因此需要在生产阶段将css单独抽离出文件，通过判断环境来加载相应配置,将module.exports导出内容变更为函数，接受环境标识

安装loader

```js
npm i postcss-loader css-loader style-loader --save-dev
```

安装插件plugin

```js
npm i mini-css-extract-plugin --save-dev
```

使用

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (isProduction) => {
    const cssFinalLoader = isProduction ? MiniCssExtractPlugin.loader : 'style-loader'
    return {
        module: {
          rules: [
            {
              test: /\.css$/,
              use: [
                cssFinalLoader, // 开发与生产使用不同loader
                {
                  loader: 'css-loader',
                  options: {
                    esModule: false, // css不使用esModule，直接输出
                    importLoaders: 1 // 使用本loader前使用1个其他处理器
                  }
                },
                'postcss-loader'
              ],
              sideEffects: true // 希望保留副作用
            }
          ]
        }
    }
}
```

前边提到了postcss-loader会根据支持度情况自动转换css内容，postcss-loader作为转换的一个平台，会提供插槽的能力，但是转换的具体规则并不会去做，因此这个转换规则需要我们通过其他插件解决。这里我们使用一个预设的转换集合`postcss-preset-env`
  
安装

```js
npm i postcss-preset-env --save-dev
```

使用

postcss.config.js文件

```js
module.exports = {
  plugins: [
    require('postcss-preset-env')
  ]
}
```

### 图片-loader

在webpack4版本中，图片类资源是通过file-loader和url-loader来配合实现。但webpack5版本中官方内置了asset来处理静态资源类。

配置

```js
module.exports = (isProduction) => {
    return {
        module: {
          rules: [
            {
              test: /\.(png|gif|jpe?g|svg)$/,
              type: 'asset', // webpack5使用内置静态资源模块，且不指定具体，根据以下规则使用
              generator: {
                filename: 'img/[name].[hash:6][ext]' // ext本身会附带点，放入img目录下
              },
              parser: {
                dataUrlCondition: {
                  maxSize: 10 * 1024 // 超过10kb的进行复制，不超过则直接使用base64
                }
              }
            }
          ]
        }
    }
}
```

### font 字体类loader

配置

与图片类资源处理相似，但去除了大小限制，因字体文件是整体，且无需额外处理，因此直接进行静态资源复制

```js
module.exports = (isProduction) => {
    return {
        module: {
          rules: [
            {
              test: /\.(ttf|woff2?|eot)$/,
              type: 'asset/resource', // 指定静态资源类复制
              generator: {
                filename: 'font/[name].[hash:6][ext]' // 放入font目录下
              }
            }
          ]
        }
    }
}      
```

### babel-loader

js模块的转换操作需要依赖babel-loader，与postcss-loader类似，babel-loader也可以理解为一个转换的平台，并不做具体转换规则，因此需要依赖`@babel/core`、`@babel/preset-env`、`@vue/cli-plugin-babel`插件来完成转换

安装

```js
npm i @babel/core @babel/preset-env @vue/cli-plugin-babel --save-dev
```

配置

```js
module.exports = (isProduction) => {
    return {
        module: {
          rules: [
            {
              test: /\.jsx?$/,
              exclude: /node_modules/, // 过滤掉node_modules目录，只使用而已
              use: 'babel-loader' // js、jsx使用bable-loader处理
            }
          ]
        }
    }
}
```

进行语法转换的时候需要排除掉node_modules目录


babel.config.js文件

```js
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
    ['@babel/preset-env', {
      useBuiltIns: 'usage', // 用到什么填充什么，按需
      corejs: 3 // 默认是2版本
    }]
  ]
}
```

### eslint-loader

代码风格检查

安装

```js
npm i eslint eslint-loader --save-dev
```

配置

```js
npx eslint --init // 根据提示完成配置，详情见webpack打包-上
```

执行完毕后会安装相关依赖和生成`.eslintrc.js`配置文件

.eslintrc.js
```js
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/essential',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'vue'
  ],
  rules: {
  }
}

```

## plugins 配置

基础功能内提供全局变量定义、页面模板、vue相关plugin等配置

```js
module.exports = (isProduction) => {
    return {
        plugins: [
          new DefinePlugin({
            BASE_URL: '"./"'
          }),
          new HtmlWebpackPlugin({
            template: 'public/index.html'
          }),
          new VueLoaderPlugin()
        ]
    }
}
```

## 区分环境构建入口配置

```js
const devConfig = require('./webpack.dev')
const prodConfig = require('./webpack.prod')
// const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// const smp = new SpeedMeasurePlugin();

module.exports = (env) => {
  // const finalResult = env.production ? prodConfig : devConfig;
  // console.log('final---->', finalResult)
  // return smp.wrap(finalResult);
  return env.production ? prodConfig : devConfig
}
```

构建时减少繁琐修改配置文件的操作，在package.json内添加启动参数来选择不同环境配置