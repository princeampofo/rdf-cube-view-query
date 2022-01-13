const rdf = require('rdf-ext')
const sparql = require('rdf-sparql-builder')
const Dimensions = require('./Dimensions')
const Filters = require('./Filters')
const Patterns = require('./Patterns')
const Result = require('./Result')
const Sources = require('./Sources')

class ViewQuery {
  constructor (ptr) {
    this.varCounts = {}

    this.view = ptr

    this.dimensions = new Dimensions(this)
    this.result = new Result(this)
    this.sources = new Sources(this)

    this.patterns = new Patterns(this)
    this.filters = new Filters(this)

    this.build()
    this.buildCount()
  }

  variable (prefix) {
    this.varCounts[prefix] = this.varCounts[prefix] || 0

    return rdf.variable(`${prefix}${this.varCounts[prefix]++}`)
  }

  build () {
    let query = sparql.select(this.result.buildProjection(), { distinct: true })
      .where([
        ...this.patterns.buildPatterns(),
        ...this.filters.buildFilters()
      ])
      .groupBy(this.result.buildGroupyByModifier())
      .having(this.filters.buildHavings())
      .orderBy(this.result.buildOrderBy())

    query = this.result.addOffsetLimit(query)

    this.query = query
  }

  buildCount () {
    this.countQuery = sparql.select(['(COUNT(*) AS ?count)'])
      .where([
        sparql.select(this.result.buildProjection(), { distinct: true })
          .where([
            ...this.patterns.buildPatterns(),
            ...this.filters.buildFilters()
          ])
          .groupBy(this.result.buildGroupyByModifier())
          .having(this.filters.buildHavings())
          .orderBy(this.result.buildOrderBy())
      ])
  }
}

module.exports = ViewQuery
