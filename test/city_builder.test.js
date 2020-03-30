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

  // it('adds the junctions', () => {

  //   // expect the diagonal streets to be joined to the 
  //   // bezier streets

  //   // expect the cross streets to be joined to the bezier
  //   // streets

  //   // expect the bezier streets to join any other
  //   // bezier street they cross
    
  // })

})