const { CityBuilder } = require("./src/city_builder")

// Make a Bezier City

const seed = 1024
const num_curves = 16
const scale = 1

const city_builder = new CityBuilder(seed, num_curves, scale);

city_builder.build_bezier_streets();

const hp = require('harry-plotter');

const filename = 'just_curves.png'
var plotter = new hp.JimpPlotter(filename, 1024, 1024);
var colour = {red: 0, green: 255, blue: 0};
const Bezier = require('bezier-js');

plotter.init(() => {

    city_builder.bezier_streets.forEach(street => {
        console.log(JSON.stringify(street))
                
        const street_points = (new Bezier(street.geometry.start.x,
                                          street.geometry.start.y,
                                          street.geometry.control.x,
                                          street.geometry.control.y,
                                          street.geometry.end.x,
                                          street.geometry.end.y).getLUT(1024))
        
        plotter.plot_points(street_points, colour);
    })
    plotter.write();
});
