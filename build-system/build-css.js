const isDev = process.env.NODE_ENV === 'development'
const fse = require('fs-extra')
const { fileEvent, timer } = require('./logger')
const { paths } = require('./config')
const glob = require('glob')
const chokidar = require('chokidar')

/**
 * PostCSS plugin setup
 */
const autoprefixer = require('autoprefixer')
const postcssimport = require('postcss-import')
const tailwind = require('tailwindcss')({
  config: require('../tailwind')
})
const postcss = require('postcss')
const polyfills = require('postcss-preset-env')({
  stage: 1,
  browsers: ['chrome 58', 'firefox 57', 'safari 11', 'edge 16'],
  preserve: false
})
const compress = require('cssnano')
const plugins = isDev
  ? [postcssimport, tailwind]
  : [postcssimport, tailwind, autoprefixer, polyfills, compress]

/**
 * Main logic
 */
const modules = paths.css.modules
const modulesFlat = () => modules.map((pattern) => glob.sync(pattern)).flat()

const preprocess = (file) => {
  const start = Date.now()
  /**
   * Just the filename without extension is needed for postcss to
   * create a matching output file
   */
  const fileName = file.match(/(\w|\d|\-)+(?=\.css)/)[0]
  const to = `${paths.css.dist}/${fileName}.css`
  fse.readFile(file, (err, css) => {
    if (err) console.log(err)
    postcss(plugins)
      .process(css, { from: file, to, map: { inline: isDev } })
      .then((result) => {
        fse.outputFile(to, result.css)
        if (result.map) fse.outputFile(`${to}.map`, result.map.toString())
        timer(file, Date.now() - start)
      })
  })
}

/**
 * Preprocess all modules
 */
const processAll = () => {
  fileEvent('boot', 'All CSS', 'Build System started')
  modulesFlat().forEach((file) => {
    preprocess(file)
  })
}

/**
 * Preprocess a single module that is given
 */
const processModule = (event, filePath) => {
  fileEvent(event, filePath, 'Module Changed: Rebuilding')
  const file = modulesFlat().find((file) => file === filePath)
  preprocess(file)
}

/**
 * Find the parent module that references the given partial
 * and preprocess it
 */
const processParent = (event, filePath) => {
  /**
   * strip path away, so we can match relative paths in parent modules
   */
  const partial = filePath.match(/(\w|\d|\-)+\.css/)[0]
  fileEvent(event, filePath, 'Partial Changed: Rebuilding Parent Module')
  modulesFlat().forEach((file) => {
    /**
     * read current file and if it references the partial,
     * preprocess it and end the loop
     */
    fse.readFile(file, (err, contents) => {
      if (err) console.log(err)
      if (contents.includes(partial)) {
        preprocess(file)
      }
    })
  })
}

/**
 * On boot always do an initial build
 */
processAll()

if (isDev) {
  /**
   * Use chokidar for our watcher to re-run our batch when
   * an add or change occurs
   */
  chokidar.watch(paths.css.watch, { ignoreInitial: true }).on('all', (event, filePath) => {
    if (event !== 'add' && event !== 'change') return
    /**
     * Tailwind JIT is fun! When you update your templates though, we need to
     * rebuild our CSS so the JIT can re-eval the template files and add the
     * newly used classes to the CSS!
     */
    if (filePath.includes('html') || filePath.includes('twig')) processAll()
    /**
     * Normal CSS source files changed, re-process accordingly
     */
    if (filePath.includes('modules')) processModule(event, filePath)
    if (filePath.includes('partials')) processParent(event, filePath)
  })
}
