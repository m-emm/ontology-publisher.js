// Workaround for the problem in rdflib.js
// rdflib.js refers to the global $rdf, which is not yet initialized
// To fix this we:
//   1. Create and export an rdf seed in rdf_seed.js
//   2. Inject this global seed as '$rdf' using the webpack ProvidePlugin
//   3. Load the real rdf libray here and copy all its fields into the rdf_seed, which is identical to the global $rdf  

var rdf_seed = require('./rdf_seed');
Object.assign(rdf_seed,require('rdflib'));
