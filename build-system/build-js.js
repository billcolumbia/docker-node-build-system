const isDev = process.env.NODE_ENV === 'development'
const { fileEvent, fileInfo, timer } = require('./logger')
const { paths, jsOptions } = require('./config')
const fs = require('fs')
const esbuild = require('esbuild')
const sveltePlugin = require('esbuild-svelte')
const globby = require('globby')
const chokidar = require('chokidar')

const modules = paths.js.modules
const modulesFlat = () => modules.map((pattern) => globby.sync(pattern)).flat()

/**
 * Build/bundle our JavaScript with esbuild
 * @param {Array} entries
 */
const build = (entries) => {
  const start = Date.now()
  esbuild
    .build({
      entryPoints: entries,
      bundle: true,
      sourcemap: isDev ? 'inline' : true,
      outdir: paths.js.dist,
      incremental: isDev,
      plugins: [sveltePlugin()],
      target: ['es2020']
    })
    .catch((err) => {
      if (jsOptions.verboseErrors) console.log(err)
    })
  entries.forEach((file) => fileInfo(file))
  timer('Modules', Date.now() - start)
}

/**
 * Build all modules
 */
const buildAll = () => {
  fileEvent('boot', 'All JavaScript', 'Build System started')
  build(modulesFlat())
}

/**
 * Build a single module, requires module filePath and event name
 * @param {String} event event name (add, change, etc from chokidar)
 * @param {String} filePath file name and path that triggered the event
 */
const buildModule = (event, filePath) => {
  fileEvent(event, filePath, 'Module Changed: Rebuilding')
  const file = modulesFlat().find((file) => file === filePath)
  build([file])
}

/**
 * Find the parent module that references the given partial
 * and build it. Requires the module filePath and event name
 * @param {String} event event name (add, change, etc from chokidar)
 * @param {String} filePath file name and path that triggered the event
 */
const buildParent = (event, filePath) => {
  /**
   * strip path away, so we can match relative paths in parent modules
   */
  let modulesQ = []
  fileEvent(event, filePath, 'Partial Changed: Rebuilding Parent Module')
  modulesFlat().forEach((file) => {
    /**
     * read current file and if it references the partial,
     * if so queue for rebuild
     */
    const contents = fs.readFileSync(file)
    if (/import.+(\w|\d|\-)+(?=')/.test(contents)) {
      modulesQ.push(file)
    }
  })
  build(modulesQ)
}

/**
 * On boot always do an initial build
 */
buildAll()

if (isDev) {
  /**
   * Use chokidar for our watcher to re-run our batch ONLY when
   * an add or change event occurs.
   */
  chokidar.watch(paths.js.watch, { ignoreInitial: true }).on('all', (event, filePath) => {
    if (event !== 'add' && event !== 'change') return
    if (filePath.includes('modules')) buildModule(event, filePath)
    else buildParent(event, filePath)
  })
}
