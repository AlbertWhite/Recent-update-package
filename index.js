/*
  For detecting the latest update of the dependencies in package.json.
*/

const fs = require("fs")
const path = require("path")
const fetch = require("node-fetch")
const { promisify } = require("util")
const chalk = require("chalk")

const ENCODING = "utf-8"
const millisecondsToDays = millisecond =>
  parseInt(millisecond / (1000 * 60 * 60 * 24), 10)

const promisifyReadFile = promisify(fs.readFile)

// get dependencies from package.json
async function getDependenciesFromPackageJson() {
  const response = await promisifyReadFile(
    path.resolve("package.json"),
    ENCODING
  )
  const dependencies = await Object.keys(JSON.parse(response).dependencies)
  return dependencies
}

// helper fonction pour appel git api
async function callApi(url) {
  const options = {
    path: url
  }
  const response = await fetch(url, options)
  const data = await response.json()
  return data
}

// get the last update
async function getLatestUpdate(dependencies, days) {
  const url = "https://registry.npmjs.org/"
  const result = await Promise.all(
    dependencies.map(dependency =>
      callApi(`${url}${dependency}`).then(response => {
        const createdDate = new Date(response.time.modified)
        const today = new Date()
        if (millisecondsToDays(today - createdDate) < days) {
          console.log(dependency, "is updated on", createdDate)
          return true
        }
        return false
      })
    )
  )
  return result.includes(true)
}

// entry point
const param = process.argv[2]
if (param && parseInt(param) > 0) {
  const formattedParam = parseInt(param)
  getDependenciesFromPackageJson().then(dependencies => {
    getLatestUpdate(dependencies, formattedParam).then(hasRecentUpdate => {
      if (!hasRecentUpdate) {
        console.log(
          `There isn't recent update in the last ${formattedParam} days.`
        )
      }
    })
  })
} else {
  console.log("*********************************")
  console.log(chalk.red("Please add a number as an option of days."))
  console.log(
    "For example : use recent-update-package 10 for getting the updates in the last 10 days."
  )
  console.log("*********************************")
}
