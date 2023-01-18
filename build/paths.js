const path = require('path')

const appRoot = process.cwd() // 命令行运行的根目录

const resolveApp = (resolvePath) => {
  return path.resolve(appRoot, resolvePath)
}

module.exports = resolveApp
