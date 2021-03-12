const isDev = process.env.NODE_ENV === 'development'
const fse = require('fs-extra')
const { log } = console
const chalk = require('chalk')
const glob = require('glob')
const chokidar = require('chokidar')
const sass = require('sass')
const postcss = require('postcss')
const polyfills = require('postcss-preset-env')({
  stage: 1,
  browsers: 'IE 11, last 2 versions',
  preserve: false
})
const compress = require('cssnano')
const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    './src/php/**/*.{php,twig}',
    './src/js/**/*.js'
  ]
})
const { fileEvent, timer } = require('./logger')

const plugins = () => {
  return isDev
    ? [polyfills]
    : [polyfills, compress, purgecss]
}

const entries = [
  'src/css/modules/*.scss'
]

const entriesFlat = entries
  .map(pattern => glob.sync(pattern))
  .flat()

const preprocess = (file, fileName) => {
  const start = Date.now()
  const sassified = sass.renderSync({ file })
  const to = `static/dist/css/${fileName}.css`
  postcss(plugins())
    .process(sassified.css, { from: file , to, map: { inline: false } })
    .then((result) => {
      fse.outputFile(to, result.css, () => true)
      if ( result.map ) {
        fse.outputFile(`${to}.map`, result.map.toString(), () => true)
      }
      timer(file, Date.now() - start)
    })
}

/**
 * Take an array of globs, pass each to glob, take the files array returned
 * by glob, and preprocess each of them. I know... loops on loops.
 */
const runBatch = (filePath) => {
  entriesFlat.forEach((file) => {
    // Only rebuild if no filepath was sent (rebuild all), or the file that was changed
    if (!filePath || filePath === file) {
      const fileName = file.match(/(\w|\d|\-)+(?=\.scss)/)[0]
      preprocess(file, fileName)
    }
  })
}

/**
 * On boot always do an initial compile
 */
runBatch()

if (isDev) {
  /**
   * Use chokidar for our watcher to re-run our batch
   */
  chokidar
    .watch(entries, { ignoreInitial: true })
    .on('all', (event, filePath) => {
      fileEvent(event, filePath, 'Rebuilding CSS')
      runBatch(filePath)
    })
} else {
  log(chalk.cyan(`✓ CSS built`))
}
