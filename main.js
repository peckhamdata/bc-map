import { CityBuilder } from './src/city-builder.js';

// Make a Bezier City

const seed = 1024
const num_curves = 16
const scale = 1

const city_builder = new CityBuilder(seed, num_curves, scale);

city_builder.build_bezier_streets();

city_builder.bezier_streets.forEach(street => {
    console.log(JSON.stringify(street))
});
