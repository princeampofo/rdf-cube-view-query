#!/usr/bin/env node

const { Source, View } = require('..')
const { collect, cubeFilter, toCsv, toTerm } = require('../lib/utils-cli')

const program = require('commander')

program
  .command('cube-dimensions')
  .option('-e, --endpoint [url]', 'SPARQL endpoint URL')
  .option('-g, --graph [url]', 'Named Graph')
  .option('-u, --user [user]', 'user for SPARQL endpoint')
  .option('-p, --password [password]', 'password for SPARQL endpoint')
  .option('--cube-name [name]', 'find cube by name')
  .option('--cube-url [url]', 'find cube by URL')
  .action(async ({ endpoint: endpointUrl, graph: sourceGraph, user, password, cubeName, cubeUrl }) => {
    const source = new Source({ endpointUrl, sourceGraph, user, password })

    const cubes = (await source.cubes()).filter(cubeFilter({ cubeName, cubeUrl }))

    for (const cube of cubes) {
      console.log(`cube: <${cube.term.value}>`)

      cube.dimensions.forEach(dimension => {
        console.log(`  dimension: <${dimension.path.value}>`)
      })
    }
  })

program
  .command('cube-observations')
  .option('-e, --endpoint [url]', 'SPARQL endpoint URL')
  .option('-g, --graph [url]', 'Named Graph')
  .option('-u, --user [user]', 'user for SPARQL endpoint')
  .option('-p, --password [password]', 'password for SPARQL endpoint')
  .option('--cube-name [name]', 'find cube by name')
  .option('--cube-url [url]', 'find cube by URL')
  .option('--dimension [url]', 'select dimensions by URL', collect, new Set())
  .option('--filter [filter-pattern]', 'select dimensions by URL', collect, new Set())
  .action(async ({ endpoint: endpointUrl, graph: sourceGraph, user, password, cubeName, cubeUrl, dimension: dimensionFilters, filter: valueFilters }) => {
    const source = new Source({ endpointUrl, sourceGraph, user, password })

    const cubes = (await source.cubes()).filter(cubeFilter({ cubeName, cubeUrl }))

    for (const cube of cubes) {
      console.log(`cube: <${cube.term.value}>`)

      const view = View.fromCube(cube)

      // select dimensions based on the given dimension URL filter
      const dimensions = view.dimensions.filter(dimension => {
        return dimension.cubeDimensions.some(cubeDimension => {
          if (dimensionFilters.size === 0) {
            return true
          }

          return [...dimensionFilters].some(dimensionFilter => cubeDimension.path.value.includes(dimensionFilter))
        })
      })

      // build filters based on the given filter patterns
      const filters = dimensions.reduce((filters, dimension) => {
        valueFilters.forEach(valueFilter => {
          const [dimensionFilter, operation, arg, datatype] = valueFilter.split(';')

          if (!dimension.cubeDimensions.some(cubeDimension => cubeDimension.path.value.includes(dimensionFilter))) {
            return
          }

          filters.push(dimension.filter[operation](toTerm(arg, datatype)))
        })

        return filters
      }, [])

      const customView = View.fromCube(cube, { dimensions, filters })
      const observations = await customView.observations()

      console.log(toCsv(observations))
    }
  })

program.parse(process.argv)