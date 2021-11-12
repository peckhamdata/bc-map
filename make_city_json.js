const hp = require("harry-plotter");
const bresenham = require("bresenham");
const CityBuilder = require('./src/city_builder.js')
const Bezier = require('bezier-js');

const fs = require('fs');


const seed = 1024
const scale = 1
const num_curves = 64
const city_builder = new CityBuilder(seed, num_curves, scale);
var plotter = new hp.JimpPlotter('./map.png', seed * scale, seed * scale);

var colour = {red: 0, green: 255, blue: 255}
var colour_2 = {red: 255, green: 140, blue: 0}
var colour_3 = {red: 255, green: 0, blue: 0}

console.log('building bezier streets...')
city_builder.build_bezier_streets();
console.log('building diagonal streets...')
city_builder.build_diagonal_streets();
// city_builder.build_cross_streets();
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

plotter.init(function() {

  city_builder.lots.forEach((lot, idx) => {
    let red = Math.floor(Math.random() * 255);
    let green = Math.floor(Math.random() * 255);
    let blue = Math.floor(Math.random() * 255);
    let colour = {red: red, green: green, blue: blue};
    console.log('Rendering ' + idx + ' of ' + city_builder.lots.length);
    lot.forEach((side) => {
      try {
        var points = bresenham(side.geometry.start.x,
          side.geometry.start.y,
          side.geometry.end.x,
          side.geometry.end.y);
        plotter.plot_points(points, colour);
      } catch (err) {
        console.log(side);
      }
    });
  });

  plotter.write();
  var street_data = JSON.stringify(city_builder.lots, null, 2)

  fs.writeFile('city.json', street_data, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
})



