const clownface = require('clownface')
const rdf = require('rdf-ext')
const ns = require('./namespaces')
const CubeDimension = require('./CubeDimension')

class Cube {
  constructor ({ term = rdf.blankNode(), dataset = rdf.dataset(), graph, source }) {
    this.ptr = clownface({ term, dataset, graph })

    this.source = source
    this.queryPrefix = '#pragma describe.strategy cbd\n'
  }

  get term () {
    return this.ptr.term
  }

  get dimensions () {
    return this.ptr
      .out(ns.cube.observationConstraint)
      .out(ns.sh.property)
      .map(ptr => new CubeDimension({ term: ptr.term, dataset: this.ptr.dataset }))
  }

  cubeQuery () {
    if (this.source.graph.termType === 'DefaultGraph') {
      return `${this.queryPrefix}DESCRIBE <${this.ptr.value}>`
    }

    return `${this.queryPrefix}DESCRIBE <${this.ptr.value}> FROM <${this.source.graph.value}>`
  }

  shapeQuery () {
    if (this.source.graph.termType === 'DefaultGraph') {
      return `${this.queryPrefix}DESCRIBE <${this.ptr.out(ns.cube.observationConstraint).value}>`
    }

    return `${this.queryPrefix}DESCRIBE <${this.ptr.out(ns.cube.observationConstraint).value}> FROM <${this.source.graph.value}>`
  }

  async init () {
    // fetch cube + metadata
    const cubeData = await this.source.client.query.construct(this.cubeQuery())
    this.ptr.dataset.addAll(cubeData)

    // fetch shapes
    const shapeData = await this.source.client.query.construct(this.shapeQuery())
    this.ptr.dataset.addAll(shapeData)
  }

  out (...args) {
    return this.ptr.out(...args)
  }
}

module.exports = Cube