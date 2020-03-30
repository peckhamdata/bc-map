const hp = require("harry-plotter");
const bresenham = require("bresenham");
const CityBuilder = require('./src/city_builder.js')

const seed = 1024
const num_curves = 64
const city_builder = new CityBuilder(seed, num_curves);
var plotter = new hp.JimpPlotter('./demo.png', seed, seed);
var colour = {red: 0, green: 100, blue: 0} 

city_builder.build_bezier_streets();
city_builder.build_diagonal_streets();

plotter.init(function() {
  city_builder.bezier_streets.forEach(street => {
    plotter.plot_points(street.geometry.getLUT(seed * 2), colour)
  });
  city_builder.diagonal_streets.forEach(street => {
    var points = bresenham(street.geometry.start.x,
                           street.geometry.start.y,
                           street.geometry.end.x,
                           street.geometry.end.y)

    plotter.plot_points(points, colour)
  });

  plotter.write();
})

