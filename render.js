const hp = require("harry-plotter");
const CityBuilder = require('./src/city_builder.js')

const seed = 1024
const num_curves = 64
const city_builder = new CityBuilder(seed, num_curves);
var plotter = new hp.JimpPlotter('./demo.png', seed, seed);
var colour = {red: 0, green: 100, blue: 0} 

city_builder.build_bezier_streets();

plotter.init(function() {
  city_builder.bezier_streets.forEach(element => {
    plotter.plot_points(element.geometry.getLUT(seed * 2), colour)
  });
  plotter.write();
})

