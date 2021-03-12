#!/usr/bin/env node
const fs = require('fs')
const glob = require('glob')
const chalk = require('chalk')
const log = console.log
const { gzipSync } = require('zlib')

/*
 *--------------------------------------------------------------------------
 * Size Check
 *--------------------------------------------------------------------------
 *
 * Take a list of files or file types combined with an upper size limit,
 * check all of them to make sure none go over the limit and log the result.
 *
 * Ex output:
 *
 * ✓ dist/js/Module.js
 * raw: 2KB | gzip: 0.5KB | limit 10KB
 *
 * ✗ dist/css/module.css
 * raw: 20KB | gzip: 12KB | limit 10KB
 *
 */

/**
 * A really lazy quick and dirty way to convert bytes to kilobytes.
 * Please keep in mind that there is plenty of room for rounding
 * errors here. For info on the unreliable nature of toFixed:
 * @url https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed#Description
 *
 * @param {int} bytes size in bytes you want in KB
 */
const toKB = (bytes) => (bytes/1000).toFixed(1)

/**
 * Create and return an object with stats about the given file
 *
 * @param {string} file file name with path
 * @param {int} limit size limit in KB
 * @return {object} fileStats object
 */
const getFileStats = (file, limit) => {
  const gzip = toKB(gzipSync(fs.readFileSync(file)).length)
  return {
    file,
    raw: toKB(fs.statSync(file)['size']),
    gzip,
    overLimit: limit < gzip,
    limit
  }
}

/**
 * Take a file stats object and log information about file size
 * in a pretty manner. Example:
 * -- dist/css/vulcan.css
 *    raw: 203.3 KB | gzip: 36.2 KB | over limit (36.2/25 KB)
 *
 * @param {object} fileStats file stats object to destructure
 */
const logFileStats = ({ file, raw, gzip, overLimit, limit }) => {
  const statusColor = overLimit ? chalk.bold.redBright : chalk.greenBright

  // within limit?
  const status = overLimit
    ? `over limit (${gzip}/${limit}KB)`
    : `limit ${limit}KB`

  log(statusColor(`${overLimit ? '✗' : '✓'} ${file}`))
  log(chalk.dim(`  raw: ${raw}KB | gzip: ${gzip}KB | ${status}\n`))
}

/**
 * Generate and return an array of fileStats objects for all
 * files that match the rule's glob pattern.
 *
 * @param {object} rule a pattern that should adhere to limit
 * @return {array} list of fileStats objects
 */
const getMatches = async (rule) => {
  const matches = await glob.sync(rule.pattern)

  return matches.map(file => {
    return {
      ...getFileStats(file, rule.limit)
    }
  })
}

const sortByBoolKey = (a, b, key) => {
  if (a[key] === b[key]) return 0
  if (a[key]) return 1
  return -1
}

/**
 * Match each rule's pattern to files, validate that each file in the
 * glob set is within the rule's limit, and log as pretty report.
 *
 * @param {array} ruleList rules with a glob pattern and a max size limit
 */
const SizeCheck = async (ruleList) => {
  const matched = await Promise.all(ruleList.map(getMatches))

  matched
    .flat()
    .sort((a, b) => sortByBoolKey(a, b, 'overLimit'))
    .forEach(file => logFileStats(file))
}

SizeCheck([
  {
    pattern: 'static/dist/**/*.js',
    limit: 20
  },
  {
    pattern: 'static/dist/**/*.css',
    limit: 15
  }
])
