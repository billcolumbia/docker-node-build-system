const chalk = require('chalk')
const { log } = console

const getTime = () => new Date().toLocaleTimeString().replace(/\s*(AM|PM)/, '')

module.exports = {
  fileEvent (event, filePath, msg) {
    const time = getTime()
    log(
      chalk.dim(`[${time}] `) +
      chalk.magenta(`[${event}] `) +
      chalk.green(`${filePath}`)
    )
    log(
      chalk.dim(`[${time}] `) +
      chalk.cyan('⟳  ') +
      chalk.dim(msg)
    )
  },
  fileInfo (file) {
    const time = getTime()
    log(
      chalk.dim(`[${time}]  - `) +
      chalk.dim(file)
    )
  },
  timer (msg, duration) {
    log(
      chalk.dim(`[${getTime()}] `) +
      chalk.green(' ✓ ') +
      chalk.dim(`${msg} built in ${duration}ms`)
    )
  }
}
