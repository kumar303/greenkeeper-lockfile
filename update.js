#!/usr/bin/env node

const fs = require('fs')

const _ = require('lodash')
const relative = require('require-relative')

const config = require('./lib/config')
const extractDependency = require('./lib/extract-dependency')
const updateShrinkwrap = require('./lib/update-shrinkwrap')
const getValuesFromCI = require('./lib/get-values-from-ci')

const pkg = relative('./package.json')

module.exports = function update () {
  try {
    fs.readFileSync('./npm-shrinkwrap.json')
  } catch (e) {
    throw new Error('Without a shrinkwrap file present there is no need to run this script')
  }

  const ciValues = getValuesFromCI()

  if (_.isEmpty(ciValues)) {
    throw new Error('This script must be run in a supported CI environment')
  }

  const isPullRequest = _.get(ciValues, 'isPullRequest', false)
  const commitMessage = _.get(ciValues, 'commitMessage', '')
  const gitBranchName = _.get(ciValues, 'gitBranchName', '')

  if (isPullRequest) {
    return console.error('This script needs to run in a branch build, not a PR')
  }

  if (!gitBranchName.startsWith(config.branchPrefix)) {
    return console.error('Not a Greenkeeper branch')
  }

  // TODO: abstract in getValuesFromCI
  if (process.env.TRAVIS_COMMIT_RANGE) {
    return console.error('Only running on first push of a new branch')
  }

  const dependency = extractDependency(pkg, config.branchPrefix, gitBranchName)

  if (!dependency) {
    return console.error('No dependency changed.')
  }

  updateShrinkwrap(dependency, commitMessage)

  console.log('Shrinkwrap file updated')
}

if (require.main === module) module.exports()
