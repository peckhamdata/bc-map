const { CityBuilder, is_lot_open } = require("./src/city_builder")

// Make a Bezier City

const seed = 1024
const num_curves = 16
const scale = 1

const fs = require('fs');

const city_builder = new CityBuilder(seed, num_curves, scale);

city_builder.build_bezier_streets();
// city_builder.build_diagonal_streets();
// city_builder.add_parallels(2);
// city_builder.add_junctions();
// city_builder.intersect_parallels();
// city_builder.split_streets();
// city_builder.add_lots();

var city_data = JSON.stringify(city_builder.bezier_streets, null, 2)

fs.writeFile('city_' + scale + '.json', city_data, function (err) {
  if (err) throw err;
  console.log('saved');
});
