const CityBuilder = require("./src/city_builder.js");

const fs = require('fs');

const seed = 1024
const scale = 100
const num_curves = 64
const city_builder = new CityBuilder(seed, num_curves, scale);

let lots = fs.readFileSync('city_100.json');
let city = JSON.parse(lots);
city_builder.add_grid(250)
city_builder.lots = lots

for (var i=0; i<city.length; i++) {
  console.log("Splitting " + i + " of " + city.length);
  city_builder.split_lot(city[i]);
}

var squares = JSON.stringify(city_builder.splits, null, 2)

fs.writeFile('city_squares_' + scale + '.json', squares, function (err) {
  if (err) throw err;
  console.log('saved');
});
