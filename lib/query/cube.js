const rdf = require('rdf-ext');
const sparql = require('rdf-sparql-builder');
const ns = require('../namespaces.js');

function cubeQuery({ cube, graph = rdf.defaultGraph() } = {}) {
  const subject = rdf.variable('subject');

  const cubePattern = [sparql.bind(subject, `<${cube.value}>`)];
  const versionHistoryPattern = [[subject, ns.schema.hasPart, cube]];

  const patterns = [sparql.union([cubePattern, versionHistoryPattern])];

  return `#pragma describe.strategy cbd
	   DESCRIBE <${cube.value}> {<http://aws.amazon.com/neptune/vocab/v01/QueryHints#Query> <http://aws.amazon.com/neptune/vocab/v01/QueryHints#describeMode> "CBD"}`;
}

module.exports = cubeQuery;
