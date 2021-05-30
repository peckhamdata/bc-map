const bresenham = require("bresenham");
const CityBuilder = require('./src/city_builder.js')
const Bezier = require('bezier-js');

const fs = require('fs');


const seed = 1024
const scale = 100
const num_curves = 64
const city_builder = new CityBuilder(seed, num_curves, scale);

city_builder.build_bezier_streets();
city_builder.build_diagonal_streets();
city_builder.build_cross_streets();
// city_builder.add_junctions();

var all_streets = [].concat(city_builder.bezier_streets, city_builder.diagonal_streets, city_builder.cross_streets);
var street_data = JSON.stringify(all_streets, null, 2)

fs.writeFile('city.json', street_data, function (err) {
  if (err) throw err;
  console.log('Saved!');
});


