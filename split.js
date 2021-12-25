const hp = require("harry-plotter");
const bresenham = require("bresenham");
const CityBuilder = require("./src/city_builder.js");

const fs = require('fs');

const seed = 1024
const scale = 1
const num_curves = 64
const city_builder = new CityBuilder(seed, num_curves, scale);

var plotter = new hp.JimpPlotter('./map_x_' + scale + '.png', seed, seed);

plotter.init(function() {

  let rawdata = fs.readFileSync('city.json');
  let city = JSON.parse(rawdata);
  city_builder.add_grid(200)

  console.log(city.length)
  for (var i=0; i<city.length; i++) {
    city_builder.split_lot(city[i])
  }
  city_builder.splits.forEach((row) => {
    row.forEach((cell) => {
      let red = Math.floor(Math.random() * 255);
      let green = Math.floor(Math.random() * 255);
      let blue = Math.floor(Math.random() * 255);
      let colour = {red: red, green: green, blue: blue};
      cell.forEach((element) => {
        var points = bresenham(element.geometry.start.x,
          element.geometry.start.y,
          element.geometry.end.x,
          element.geometry.end.y);
        plotter.plot_points(points, colour);
      })  
    }) 
  })  
  plotter.write();

})



