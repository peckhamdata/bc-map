const CityBuilder = require('./src/city_builder.js')

const fs = require('fs');
const seed = 1024
const scale = 100
const num_curves = 64
const city_builder = new CityBuilder(seed, num_curves, scale);

console.log('building bezier streets...')
city_builder.build_bezier_streets();
console.log('building diagonal streets...')
city_builder.build_diagonal_streets();
city_builder.flip_y();
console.log('adding parallels')
city_builder.add_parallels(2);
console.log('adding junctions')
city_builder.add_junctions();
console.log('intersecting parallels')
city_builder.intersect_parallels();
console.log('splitting streets')
city_builder.split_streets();
console.log('adding lots')
city_builder.add_lots();

var street_data = JSON.stringify(city_builder.lots, null, 2)

fs.writeFile('city_' + scale + '.json', street_data, function (err) {
  if (err) throw err;
  console.log('saved');
});

