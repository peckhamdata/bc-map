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

city_builder.build_bezier_streets();
city_builder.build_diagonal_streets();
city_builder.build_cross_streets();
// city_builder.add_junctions();

plotter.init(function() {
  // city_builder.bezier_streets.forEach(street => {
  //   var street_curve = new Bezier(street.geometry.start.x,
  //                                 street.geometry.start.y,
  //                                 street.geometry.control.x,
  //                                 street.geometry.control.y,
  //                                 street.geometry.end.x,
  //                                 street.geometry.end.y)
  //   var points = street_curve.getLUT(this.curve_num_points * (scale * 10))
  //   console.log('rendering bezier street ' + street.id + ' of ' + city_builder.bezier_streets.length)
  //   plotter.plot_points(points, colour)
  //   render_junctions(street, colour_2 )
  // });
  city_builder.diagonal_streets.forEach(street => {
    var points = bresenham(street.geometry.start.x,
                           street.geometry.start.y,
                           street.geometry.end.x,
                           street.geometry.end.y)
    console.log('rendering diagonal street ' + street.id + ' of ' + city_builder.diagonal_streets.length)

    plotter.plot_points(points, colour)
    // render_junctions(street, colour_2 )
  });
  city_builder.cross_streets.forEach(street => {
    var points = bresenham(street.geometry.start.x,
                           street.geometry.start.y,
                           street.geometry.end.x,
                           street.geometry.end.y)

    console.log('rendering cross street ' + street.id + ' of ' + city_builder.cross_streets.length)

    plotter.plot_points(points, colour)
    // render_junctions(street, colour_2 )
  });

  plotter.write();
  var all_streets = [].concat(city_builder.bezier_streets, city_builder.diagonal_streets, city_builder.cross_streets)
  var street_data = JSON.stringify(all_streets, null, 2)

  fs.appendFile('city.json', street_data, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
})


function render_junctions(street, colour) {
    // Render junctions
    var points
    if (street.type === 'bezier') {
      var street_curve = new Bezier(street.geometry.start.x,
                                    street.geometry.start.y,
                                    street.geometry.control.x,
                                    street.geometry.control.y,
                                    street.geometry.end.x,
                                    street.geometry.end.y)

      points = street_curve.getLUT(city_builder.curve_num_points)
    } else {
      points = bresenham(street.geometry.start.x,
                         street.geometry.start.y,
                         street.geometry.end.x,
                         street.geometry.end.y)
    }

    street.junctions.forEach(function(junction, x) {
      var address = junction.address
      if (address == -1) {
        address = points.length-1
      }
      var point = points[address]
      if (typeof point !== 'undefined') {
        plotter.plot_points([point], colour);
      } else {
        console.log(street.id, street.type, address, points.length)
      }
    })
}
