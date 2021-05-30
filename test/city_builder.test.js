const CityBuilder = require("../src/city_builder.js");

describe('City Builder', () => {

  it('sets up the parameters for the city', () => {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    expect(city_builder.bezier_sequence.length).toEqual(num_curves)
  })

  it('gives each street a unique id', () => {
    const expected = [0,1,2,3,4,5];
    const city_builder = new CityBuilder();

    for(var i=0; i<expected.length; i++) {
      const actual = city_builder.street_id();
      expect(actual).toEqual(expected[i]);
    }
  })

  it('creates the initial bezier streets', () => {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);
    city_builder.build_bezier_streets();
    expect(city_builder.bezier_streets.length).toEqual(num_curves)
  })

  it('creates the diagonal streets', () => {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);
    city_builder.build_bezier_streets();
    city_builder.build_diagonal_streets();
    expect(city_builder.diagonal_streets.length).toEqual(285)
  })

  it('creates the cross streets', () => {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);
    city_builder.build_bezier_streets();
    city_builder.build_diagonal_streets();
    city_builder.build_cross_streets();
    expect(city_builder.cross_streets.length).toEqual(280)
  })

  it('adds the junctions', () => {

    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    const streets = [{id: 1,
                      geometry: {start: {x:5, y:0},
                                 end:   {x:5, y:10}}},
                     {id: 2,
                      geometry: {start: {x:0, y:5},
                                 end:   {x:10, y:5}}},
                     {id: 3,
                      geometry: {start: {x:0, y:0},
                      end:   {x:2, y:3}}}];
    const junctions = city_builder.add_junctions(streets, streets);

    expect(junctions).toEqual([{id: 0, street_id: 1, x:5, y:5},
                                        {id: 1, street_id: 2, x:5, y:5}])

  })

})
