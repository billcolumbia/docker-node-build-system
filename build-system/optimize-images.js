const util = require('util')
const imagemin = require('imagemin')
const jpeg = require('imagemin-mozjpeg')
const png = require('imagemin-pngquant')
const svg = require('imagemin-svgo')
const gif = require('imagemin-gifsicle')
const chalk = require('chalk')
const rimraf = util.promisify(require('rimraf'))
const { paths } = require('./config')
const { log } = console

/*
 *--------------------------------------------------------------------------
 * Optimize Images
 *--------------------------------------------------------------------------
 *
 * Use imagemin to opimize all our image assets. Before optimizing, always
 * clean out the destination folder so we have a clean batch. This is
 * helpful incase a compression setting or some other config in here is
 * changed. Log the results.
 *
 */

const directories = [
  {
    source: [`${paths.images.src}/misc/**/*.{jpg,png,svg,gif}`],
    destination: `${paths.images.dist}/misc`,
    plugins: [
      jpeg({ quality: 60 }),
      png(),
      svg(),
      gif()
    ]
  },
  {
    source: [`${paths.images.src}/logos/**/*.{jpg,png,svg}`],
    destination: `${paths.images.dist}/logos`,
    plugins: [
      jpeg({ quality: 60 }),
      png(),
      svg()
    ]
  },
  {
    source: [`${paths.images.src}/icons/**/*.svg`],
    destination: `${paths.images.dist}/icons`,
    plugins: [
      svg({
        plugins: [
          { removeAttrs: { attrs: 'fill' } },
          { removeUselessDefs: false },
          { cleanupIDs: false }
        ]
      })
    ]
  }
]

const optimize = async () => {
  log(chalk.redBright('\n🧹 Cleaning dist/images...'))
  await rimraf(`${paths.images.dist}/{**/*,*}`)
  log(chalk.green('✨ All clean!'))

  const start = Date.now()
  log(chalk.cyan('🗜  Optimizing images...'))
  await Promise.all(directories.map(async (dir) => {
    const { source, destination, plugins } = dir
    const batch = await imagemin(source, { destination, plugins })
    batch.forEach((file) => {
      log(chalk.dim(' - ' + file.destinationPath))
    })
  }))
  log(chalk.green(`✅ Images optimized in ${Date.now() - start}ms`))
}

optimize()
