const isDev = process.env.NODE_ENV === 'development'
const { fileEvent, fileInfo, timer } = require('./logger')
const { paths } = require('./config')
const fs = require('fs')
const esbuild = require('esbuild')
const glob = require('glob')
const chokidar = require('chokidar')

const modules = paths.js.modules
const modulesFlat = () => modules
  .map(pattern => glob.sync(pattern))
  .flat()

const build = (entries) => {
  const start = Date.now()
  esbuild
    .build({
      entryPoints: entries,
      bundle: true,
      sourcemap: isDev ? 'inline' : true,
      outdir: paths.js.dist,
      incremental: isDev,
      target: [
        'chrome56',
        'firefox51',
        'safari11',
        'edge16',
      ]
    })
    .catch((err) => console.log(err))
  entries.forEach(file => fileInfo(file))
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
 * Build a single module that is given
 */
const buildModule = (event, filePath) => {
  fileEvent(event, filePath, 'Module Changed: Rebuilding')
  const file = modulesFlat().find(file => file === filePath)
  build([file])
}

/**
 * Find the parent module that references the given partial 
 * and build it
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
   * Use chokidar for our watcher to re-run our batch when
   * an add or change occurs
   */
  chokidar
    .watch(paths.js.watch, { ignoreInitial: true })
    .on('all', (event, filePath) => {
      if (event !== 'add' && event !== 'change') return
      if (filePath.includes('modules')) buildModule(event, filePath)
      else buildParent(event, filePath)
    })
}
