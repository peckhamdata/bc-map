const { CityBuilder, is_lot_open } = require("./src/city_builder")

// Make a Bezier City

const seed = 1024
const num_curves = 16
const scale = 1

const city_builder = new CityBuilder(seed, num_curves, scale);

city_builder.build_bezier_streets();
city_builder.build_diagonal_streets();
city_builder.add_parallels(2);
city_builder.add_junctions();
city_builder.intersect_parallels();
city_builder.split_streets();
city_builder.add_lots();

const hp = require('harry-plotter');

const filename = 'assets/lots.png'
var plotter = new hp.JimpPlotter(filename, 1024, 1024);
const bresenham = require("bresenham");

plotter.init(() => {

    city_builder.lots.forEach(lot => {
        const line = is_lot_open(lot.edges)

        if (line !== undefined) {
            console.log(line)
            lot.edges.push(line)
        }

        let red = Math.floor(Math.random() * 255);
        let green = Math.floor(Math.random() * 255);
        let blue = Math.floor(Math.random() * 255);
        let colour = {red: red, green: green, blue: blue};

        lot.edges.forEach(edge => {
            var points = bresenham(edge.geometry.start.x,
                edge.geometry.start.y,
                edge.geometry.end.x,
                edge.geometry.end.y);
            plotter.plot_points(points, colour);

        });
    
    });

    plotter.write();
             
})
