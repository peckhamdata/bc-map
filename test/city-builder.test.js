const CityBuilder = require("../src/city_builder.js");

describe('City Builder', () => {

  // it('sets up the parameters for the city', () => {
  // })

  it('gives each street a unique id', () => {
    const expected = [0,1,2,3,4,5];
    const city_builder = new CityBuilder();

    for(var i=0; i<expected.length; i++) {
      const actual = city_builder.street_id();
      expect(actual).toEqual(expected[i]);
    }
  })

  // it('creates the initial bezier streets', () => {

  //   // expect an array of bezier streets
  // })

  // it('creates the diagonal streets', () => {

  //   // expect an array of diagonal streets
  // })

  // it('creates the cross streets', () => {

  //   // expect an array of cross streets
  // })

  // it('adds the junctions', () => {

  //   // expect the diagonal streets to be joined to the 
  //   // bezier streets

  //   // expect the cross streets to be joined to the bezier
  //   // streets

  //   // expect the bezier streets to join any other
  //   // bezier street they cross
    
  // })

})