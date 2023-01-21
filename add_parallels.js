const { CityBuilder } = require("./src/city_builder")

// Make a Bezier City

const seed = 1024
const num_curves = 16
const scale = 1

const city_builder = new CityBuilder(seed, num_curves, scale);

city_builder.build_bezier_streets();
city_builder.build_diagonal_streets();
city_builder.add_parallels(5);

console.log(city_builder.streets)

const hp = require('harry-plotter');

const filename = 'assets/add_parallels.png'
var plotter = new hp.JimpPlotter(filename, 1024, 1024);
var colour = {red: 0, green: 255, blue: 0};
const bresenham = require("bresenham");

plotter.init(() => {

    city_builder.streets.forEach(street => {
        console.log(JSON.stringify(street))
                
        var points = bresenham(street.edges.minus.geometry.start.x,
            street.edges.minus.geometry.start.y,
            street.edges.minus.geometry.end.x,
            street.edges.minus.geometry.end.y);
        plotter.plot_points(points, colour);
            points = bresenham(street.edges.plus.geometry.start.x,
            street.edges.plus.geometry.start.y,
            street.edges.plus.geometry.end.x,
            street.edges.plus.geometry.end.y);
        plotter.plot_points(points, colour);
    });
    plotter.write();
             
})
