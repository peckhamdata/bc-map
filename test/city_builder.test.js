const CityBuilder = require("../src/city_builder.js");

const two_streets = [
      {
        id: 0,
        geometry: {
          end: {x: 25, y: 100},
          start: {x: 0, y: 0}
        }
      },
      {
        id: 1,
        geometry: {
          start: {x: 25, y: 0},
          end: {x: 25, y: 100}
        }
      },
      {
        id: 4,
        geometry: {
          start: {x: 5, y: 35},
          end: {x: 55, y: 90}
        }
      },
]

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
    city_builder.streets = streets;
    city_builder.add_junctions();

    expect(city_builder.streets[0].junctions).toEqual([{street_id: 2, x:5, y:5}]);

  })

  it('sorts junctions by distance from the start of the street', () => {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    var street = {
      id: 1,
      geometry: {
        start: {x: 0, y: 0},
        end: {x: 100, y: 100}
      },
      junctions: [
        {x: 90, y: 90},
        {x: 10, y: 10},
        {x: 60, y: 60},
        {x: 50, y: 50}
      ]
    };

    const expected = [
      {x: 10, y: 10, distance: 14},
      {x: 50, y: 50, distance: 70},
      {x: 60, y: 60, distance: 84},
      {x: 90, y: 90, distance: 127}
    ]
    city_builder.sort_junctions(street);
    expect(street.junctions).toEqual(expected);
  })

  it ('adds intersections with parallels to parallels', () => {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    const streets = [
      {
        id: 1,
        geometry: {
          start: {x: 25, y: 0},
          end: {x: 25, y: 100}
        }
      },
      {
        id: 2,
        geometry: {
          start: {x: 0, y: 25},
          end: {x: 80, y: 60}
        }
      },
      {
        id: 3,
        geometry: {
          start: {x: 45, y: 0},
          end: {x: 55, y: 90}
        }
      },
      {
        id: 4,
        geometry: {
          start: {x: 5, y: 35},
          end: {x: 55, y: 90}
        }
      },
    ];

    city_builder.streets = streets;
    city_builder.add_parallels(2);

    city_builder.intersect_parallels();
    const expected = {"plus":{"geometry":{"start":{"x":27,"y":0},"end":{"x":27,"y":100}},"junctions":[{"street_id":2,"x":27,"y":34,"edge":"plus","distance":34},{"street_id":2,"x":27,"y":36,"edge":"centre","distance":36},{"street_id":2,"x":27,"y":38,"edge":"minus","distance":38},{"street_id":4,"x":27,"y":56,"edge":"plus","distance":56},{"street_id":4,"x":27,"y":59,"edge":"centre","distance":59},{"street_id":4,"x":27,"y":62,"edge":"minus","distance":62}]},"minus":{"geometry":{"start":{"x":23,"y":0},"end":{"x":23,"y":100}},"junctions":[{"street_id":2,"x":23,"y":33,"edge":"plus","distance":33},{"street_id":2,"x":23,"y":35,"edge":"centre","distance":35},{"street_id":2,"x":23,"y":36,"edge":"minus","distance":36},{"street_id":4,"x":23,"y":51,"edge":"plus","distance":51},{"street_id":4,"x":23,"y":54,"edge":"centre","distance":54},{"street_id":4,"x":23,"y":57,"edge":"minus","distance":57}]}}
    expect(city_builder.streets[0].edges).toEqual(expected)
  })

  it('splits a street into smaller streets', () => {

    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    const streets = [
      {
        id: 0,
        geometry: {
          end: {x: 25, y: 100},
          start: {x: 0, y: 0}
        }
      },
      {
        id: 1,
        geometry: {
          end: {x: 25, y: 100},
          start: {x: 25, y: 0}
        }
      },
      {
        id: 2,
        geometry: {
          start: {x: 0, y: 25},
          end: {x: 80, y: 60}
        }
      },
      {
        id: 3,
        geometry: {
          start: {x: 45, y: 0},
          end: {x: 55, y: 90}
        }
      },
      {
        id: 4,
        geometry: {
          start: {x: 5, y: 35},
          end: {x: 55, y: 90}
        }
      },
      {
        id: 5,
        geometry: {
          start: {x: 145, y: 0},
          end: {x: 155, y: 90}
        }
      },
      {
        id: 6,
        geometry: {
          start: {x: 155, y: 90},
          end: {x: 55, y: 130}
        }
      },
    ];

    city_builder.streets = two_streets;
    city_builder.add_parallels(2);
    city_builder.add_junctions();
    city_builder.intersect_parallels();
    city_builder.split_streets();

    // TODO: How are we testing this?
    expect(city_builder.lot_edges.length).toEqual(8)
  });

  it('adds a grid of squares to the map', ()=> {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    const expected = [
      {x: 0,
       y: 0,
       geometry: {
         start: {x: 0, y: 0},
	 end:   {x: , y: }      
       }
      }	    
    ]

    city_builder.add_grid();
    expect(city_builder.grid).toEqual(expected); 	  
  });

  it('divides edges into squares on the map', ()=> {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    const streets = [
      {
        id: 0,
        geometry: {
          end: {x: 50, y: 200},
          start: {x: 0, y: 0}
        }
      },
      {
        id: 0,
        geometry: {
          end: {x: 200, y: 50},
          start: {x: 0, y: 100}
        }
      }
    ]

    city_builder.streets = streets;
    city_builder.add_parallels(2);
    city_builder.add_junctions();
    city_builder.intersect_parallels();
    city_builder.split_streets();

    render(city_builder, 'test_split.png');	  
  });


  it('makes lots from edges', ()=> {
    const seed = 1024
    const num_curves = 16
    const city_builder = new CityBuilder(seed, num_curves);

    const streets = [
      {
        id: 0,
        geometry: {
          end: {x: 25, y: 100},
          start: {x: 0, y: 0}
        }
      },
      {
        id: 1,
        geometry: {
          end: {x: 25, y: 100},
          start: {x: 25, y: 0}
        }
      },
      {
        id: 2,
        geometry: {
          start: {x: 0, y: 25},
          end: {x: 80, y: 60}
        }
      },
      {
        id: 3,
        geometry: {
          start: {x: 45, y: 0},
          end: {x: 55, y: 90}
        }
      },
      {
        id: 4,
        geometry: {
          start: {x: 5, y: 35},
          end: {x: 55, y: 90}
        }
      },
      {
        id: 5,
        geometry: {
          start: {x: 145, y: 0},
          end: {x: 155, y: 90}
        }
      },
      {
        id: 6,
        geometry: {
          start: {x: 155, y: 90},
          end: {x: 55, y: 130}
        }
      },
    ];

    city_builder.streets = streets;
    city_builder.add_parallels(2);
    city_builder.add_junctions();
    city_builder.intersect_parallels();
    city_builder.split_streets();
    city_builder.add_lots();

    render(city_builder, 'test.png');	  
  })
});
	  

function render(city_builder, filename) {	
  const hp = require("harry-plotter");
  const bresenham = require("bresenham");

  var plotter = new hp.JimpPlotter(filename, 256, 256);
  var colour_2 = {red: 0, green: 255, blue: 0};
  var colour_3 = {red: 255, green: 0, blue: 0};
  var colour_4 = {red: 255,   green: 0, blue: 0};

  plotter.init(() => {
     city_builder.streets.forEach(street => {
       var points = bresenham(street.edges.minus.geometry.start.x,
         street.edges.minus.geometry.start.y,
         street.edges.minus.geometry.end.x,
         street.edges.minus.geometry.end.y);
        plotter.plot_points(points, colour_3);
         points = bresenham(street.edges.plus.geometry.start.x,
         street.edges.plus.geometry.start.y,
         street.edges.plus.geometry.end.x,
         street.edges.plus.geometry.end.y);
        plotter.plot_points(points, colour_2);
     });
     city_builder.lot_edges.forEach(edge => {
       var points = bresenham(edge.geometry.start.x,
         edge.geometry.start.y,
         edge.geometry.end.x,
         edge.geometry.end.y);
       // plotter.plot_points(points, colour_4);
     });
    city_builder.lots.forEach((lot, idx) => {
      let red = Math.floor(Math.random() * 255);
      let green = Math.floor(Math.random() * 255);
      let blue = Math.floor(Math.random() * 255);
      let colour = {red: red, green: green, blue: blue};
      lot.forEach((side) => {
        try {
          var points = bresenham(side.geometry.start.x,
            side.geometry.start.y,
            side.geometry.end.x,
            side.geometry.end.y);
            plotter.plot_points(points, colour_4);
        } catch (err) {
          console.log(lot);
        }
      });
    });
    plotter.write();
  });
}

// If the first junction is at the start of your street and the end of another street - do nothing.
