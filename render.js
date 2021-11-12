const hp = require("harry-plotter");
const bresenham = require("bresenham");

const fs = require('fs');

const seed = 1024
const scale = 20
const size = seed * scale
var plotter = new hp.JimpPlotter('./map_x_' + scale + '.png', size, size);

plotter.init(function() {

  let rawdata = fs.readFileSync('enlarged_city.json');
  let city = JSON.parse(rawdata);

  let enlarged = [];

  city.forEach((row) => {
    let red = Math.floor(Math.random() * 255);
    let green = Math.floor(Math.random() * 255);
    let blue = Math.floor(Math.random() * 255);
    let colour = {red: red, green: green, blue: blue};
    row.forEach((element) => {
      var points = bresenham(element.geometry.start.x,
        element.geometry.start.y,
        element.geometry.end.x,
        element.geometry.end.y);
      plotter.plot_points(points, colour);
    });
  });

  plotter.write();

})



