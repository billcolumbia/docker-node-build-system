#!/usr/bin/env node
const { readFile, writeFile } = require('fs/promises')
const c = require('chalk')
const crypto = require('crypto')
const globby = require('globby')
const { paths } = require('./config')

/*
 *--------------------------------------------------------------------------
 * Generate an asset manifest
 *--------------------------------------------------------------------------
 *
 * For all the static files we serve with good caching, we will need good
 * cache busting where there has been a change. The manifest generator
 * creates a map of objects for each file: { filename: filename?ver=###### }
 * which allows our server code to reference a file by name, while actually
 * outputing the filename, plus a query string that represents the file's
 * contents as a hash.
 *
 * This strategy is important versus timestamps as timestamps invalidate
 * the cache everytime a file is built even if it has the same contents.
 * Using a content hash, if we for example, revert a file, it will have
 * the same hash it previously had and then users wont need a new copy
 * of the same file!
 *
 */

/**
 * Ripped from rev-hash, generate hash based on a files contents
 * @param {Buffer|String} contents contents of a read file
 * @returns {String} hash of file's contents
 */
const genHash = async (filePath) => {
  const contents = await readFile(filePath)
  if (typeof contents !== 'string' && !Buffer.isBuffer(contents)) {
    throw new TypeError('Expected a Buffer or string')
  }
  return crypto.createHash('md5').update(contents).digest('hex').slice(0, 10)
}

;(async () => {
  /**
   * @description Manifest of assets, mapped to their content hashes
   * @type Object
   */
  const manifest = {}
  const assets = await globby(`${paths.dist}/**/*.{jpg,png,js,css,svg}`)

  assets.forEach((file) => {
    const fileName = file.substring(file.lastIndexOf('/') + 1 || 0)
    manifest[fileName] = `${fileName}?ver=${genHash(file)}`
  })

  await writeFile(`${paths.dist}/manifest.json`, JSON.stringify(manifest))

  console.log(c.greenBright(`✓ Created file hashes in ${paths.dist}/manifest.json`))
})()
