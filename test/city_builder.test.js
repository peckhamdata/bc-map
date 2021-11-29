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
    expect(city_builder.lot_edges.length).toEqual(16)
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

    render(city_builder, 'test_split.png');	  

    const expected =  [[{"geometry": {"end": {"x": 4, "y": 24}, "start": {"x": 0, "y": 23}}, "id": 18}, {"geometry": {"end": {"x": 4, "y": 24}, "start": {"x": -2, "y": 0}}, "id": 0}], [{"geometry": {"end": {"x": 5, "y": 28}, "start": {"x": -1, "y": 26}}, "id": 14}, {"geometry": {"end": {"x": 6, "y": 33}, "start": {"x": 5, "y": 28}}, "id": 1}], [{"geometry": {"end": {"x": 23, "y": 100}, "start": {"x": 8, "y": 42}}, "id": 3}, {"geometry": {"end": {"x": 8, "y": 42}, "start": {"x": 3, "y": 36}}, "id": 27}, {"geometry": {"end": {"x": 23, "y": 100}, "start": {"x": 8, "y": 42}}, "id": 2}], [{"geometry": {"end": {"x": 23, "y": 33}, "start": {"x": 23, "y": 0}}, "id": 7}, {"geometry": {"end": {"x": 23, "y": 33}, "start": {"x": 7, "y": 26}}, "id": 19}, {"geometry": {"end": {"x": 7, "y": 26}, "start": {"x": 1, "y": -1}}, "id": 4}], [{"geometry": {"end": {"x": 23, "y": 51}, "start": {"x": 10, "y": 38}}, "id": 31}, {"geometry": {"end": {"x": 23, "y": 51}, "start": {"x": 23, "y": 36}}, "id": 8}, {"geometry": {"end": {"x": 23, "y": 36}, "start": {"x": 8, "y": 30}}, "id": 15}, {"geometry": {"end": {"x": 10, "y": 38}, "start": {"x": 8, "y": 30}}, "id": 5}], [{"geometry": {"end": {"x": 23, "y": 58}, "start": {"x": 13, "y": 47}}, "id": 28}, {"geometry": {"end": {"x": 23, "y": 87}, "start": {"x": 23, "y": 57}}, "id": 9}, {"geometry": {"end": {"x": 23, "y": 87}, "start": {"x": 13, "y": 47}}, "id": 6}], [{"geometry": {"end": {"x": 47, "y": 43}, "start": {"x": 43, "y": 0}}, "id": 22}, {"geometry": {"end": {"x": 47, "y": 43}, "start": {"x": 27, "y": 34}}, "id": 20}, {"geometry": {"end": {"x": 27, "y": 34}, "start": {"x": 27, "y": 0}}, "id": 11}], [{"geometry": {"end": {"x": 52, "y": 83}, "start": {"x": 27, "y": 56}}, "id": 32}, {"geometry": {"end": {"x": 52, "y": 83}, "start": {"x": 48, "y": 47}}, "id": 23}, {"geometry": {"end": {"x": 48, "y": 47}, "start": {"x": 27, "y": 38}}, "id": 16}, {"geometry": {"end": {"x": 27, "y": 56}, "start": {"x": 27, "y": 38}}, "id": 12}], [{"geometry": {"end": {"x": 53, "y": 91}, "start": {"x": 27, "y": 62}}, "id": 29}, {"geometry": {"end": {"x": 27, "y": 100}, "start": {"x": 27, "y": 62}}, "id": 13}], [{"geometry": {"end": {"x": 56, "y": 88}, "start": {"x": 55, "y": 87}}, "id": 33}, {"geometry": {"end": {"x": 56, "y": 89}, "start": {"x": 51, "y": 48}}, "id": 26}, {"geometry": {"end": {"x": 55, "y": 87}, "start": {"x": 51, "y": 48}}, "id": 25}, {"geometry": {"end": {"x": 79, "y": 61}, "start": {"x": 51, "y": 48}}, "id": 17}], [{"geometry": {"end": {"x": 51, "y": 45}, "start": {"x": 46, "y": -1}}, "id": 24}, {"geometry": {"end": {"x": 80, "y": 58}, "start": {"x": 51, "y": 45}}, "id": 21}], [{"geometry": {"end": {"x": 54, "y": 128}, "start": {"x": 154, "y": 88}}, "id": 38}, {"geometry": {"end": {"x": 152, "y": 88}, "start": {"x": 154, "y": 88}}, "id": 37}, {"geometry": {"end": {"x": 153, "y": 90}, "start": {"x": 143, "y": 0}}, "id": 35}, {"geometry": {"end": {"x": 152, "y": 88}, "start": {"x": 143, "y": 0}}, "id": 34}]];
    expect(city_builder.lots).toEqual(expected);
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
          console.log(err, lot);
        }
      });
    });
    plotter.write();
  });
}


it('adds a grid of squares to the map', ()=> {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);

  const expected = {
    "x": [
      {
        "geometry": {
          "start": {
            "x": 0,
            "y": 0
          },
          "end": {
            "x": 0,
            "y": 1024
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 200,
            "y": 0
          },
          "end": {
            "x": 200,
            "y": 1024
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 400,
            "y": 0
          },
          "end": {
            "x": 400,
            "y": 1024
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 600,
            "y": 0
          },
          "end": {
            "x": 600,
            "y": 1024
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 800,
            "y": 0
          },
          "end": {
            "x": 800,
            "y": 1024
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 1000,
            "y": 0
          },
          "end": {
            "x": 1000,
            "y": 1024
          }
        }
      }
    ],
    "y": [
      {
        "geometry": {
          "start": {
            "x": 0,
            "y": 0
          },
          "end": {
            "x": 1024,
            "y": 0
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 0,
            "y": 200
          },
          "end": {
            "x": 1024,
            "y": 200
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 0,
            "y": 400
          },
          "end": {
            "x": 1024,
            "y": 400
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 0,
            "y": 600
          },
          "end": {
            "x": 1024,
            "y": 600
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 0,
            "y": 800
          },
          "end": {
            "x": 1024,
            "y": 800
          }
        }
      },
      {
        "geometry": {
          "start": {
            "x": 0,
            "y": 1000
          },
          "end": {
            "x": 1024,
            "y": 1000
          }
        }
      }
    ]
  }

  city_builder.add_grid(200);
  expect(city_builder.grid).toEqual(expected); 	  
});

it('puts an edge starting to the left of and intersecting a vertical grid line in the column to the left', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = {"square":{"x":0, "y":0}, 
                    "geometry":{"start":{"x":0,"y":0},"end":{"x":200,"y":200}}};
  const actual = city_builder.split_line({"geometry":{"start":{"x":0,"y":0},"end":{"x":1024,"y":1024}}});
  expect(actual).toEqual(expected);

})

it('puts an edge starting to the left of and intersecting a horizontal grid line in the column to the left', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = {"square":{"x":0, "y":0}, 
                    "geometry":{"start":{"x":0,"y":0},"end":{"x":58,"y":200}}};
  const actual = city_builder.split_line({"geometry":{"start":{"x":0,"y":0},"end":{"x":300,"y":1024}}});
  expect(actual).toEqual(expected);

})

it('deals with right to left/top to bottom lines', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = {"square":{"x":1, "y":0}, 
                    "geometry":{"start":{"x":300,"y":0},"end":{"x":260,"y":200}}};
  const actual = city_builder.split_line({"geometry":{"start":{"x":300,"y":0},"end":{"x":100,"y":1024}}});
  expect(actual).toEqual(expected);
})

it('deals with right to left/bottom to top lines', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = {"square":{"x":1, "y":1}, 
                    "geometry":{"start":{"x":295,"y":400},"end":{"x":200,"y":270}}};
  const actual = city_builder.split_line({"geometry":{"start":{"x":295,"y":400},"end":{"x":10,"y":10}}});
  expect(actual).toEqual(expected);
})

it('deals with bottom to top lines', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = {"square":{"x":1, "y":1}, 
                    "geometry":{"start":{"x":300,"y":300},"end":{"x":200,"y":200}}};
  const actual = city_builder.split_line({"geometry":{"start":{"x":300,"y":300},"end":{"x":100,"y":100}}});
  expect(actual).toEqual(expected);

})

it('deals with lines that end within squares', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = {"square":{"x":1, "y":1}, 
                    "geometry":{"start":{"x":200,"y":200},"end":{"x":300,"y":300}}};
  const actual = city_builder.split_line({"geometry":{"start":{"x":200,"y":200},"end":{"x":300,"y":300}}});
  expect(actual).toEqual(expected);

})

it('deals with a tricksy line', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = {"square":{"x":0, "y":0}, 
                    "geometry":{"start":{"x":148,"y":200},"end":{"x":10,"y":10}}};
  const actual = city_builder.split_line({ geometry: { start: { x: 148, y: 200 }, end: { x: 10, y: 10 } }});
  expect(actual).toEqual(expected);

})

it('splits a line across multiple squares', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);

  const expected = [{"square":{"x":0, "y":0}, 
                    "geometry":{"start":{"x":100,"y":100},"end":{"x":200,"y":200}}},
                    {"square":{"x":1, "y":1}, 
                    "geometry":{"start":{"x":200,"y":200},"end":{"x":300,"y":300}}}];
  const actual = city_builder.line_to_squares({"geometry":{"start":{"x":100,"y":100},"end":{"x":300,"y":300}}});
  expect(actual).toEqual(expected);

})

it('splits a line across multiple squares right to left', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);

  const expected = [{"square":{"x":1, "y":2}, 
                     "geometry":{"start":{"x":310,"y":420},"end":{"x":295,"y":400}}}, 
                    {"square":{"x":1, "y":1},
                     "geometry":{"start":{"x":295,"y":400},"end":{"x":200,"y":270}}},
                     {"square":{"x":0, "y":1},
                     "geometry":{"start":{"x":200,"y":270},"end":{"x":148,"y":200}}},
                    {"square":{"x":0, "y":0},
                     "geometry":{"start":{"x":148,"y":200},"end":{"x":10,"y":10}}}                    
                    ];
  const actual = city_builder.line_to_squares({"geometry":{"start":{"x":310,"y":420},"end":{"x":10,"y":10}}});
  expect(actual).toEqual(expected);
})

it('splits a lot across multiple squares', async () => {
  const lot = [
    {id: 1, geometry: {start: {x: 10, y:10},
                       end:   {x: 210, y: 210}}},
    {id: 2, geometry: {start: {x: 210, y:210},
                       end:   {x: 310, y: 420}}},
    {id: 3, geometry: {start: {x: 310, y:420},
                       end:   {x: 10, y: 10}}}
  ]
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected =
  [
    [
      [
        {
          "geometry": {
            "start": {
              "x": 10,
              "y": 10
            },
            "end": {
              "x": 200,
              "y": 200
            }
          }
        },
        {
          "geometry": {
            "start": {
              "x": 148,
              "y": 200
            },
            "end": {
              "x": 10,
              "y": 10
            }
          }
        }
      ],
      [
        {
          "geometry": {
            "start": {
              "x": 200,
              "y": 270
            },
            "end": {
              "x": 148,
              "y": 200
            }
          }
        }
      ],
      [],
      [],
      [],
      []
    ],
    [
      [],
      [
        {
          "geometry": {
            "start": {
              "x": 200,
              "y": 200
            },
            "end": {
              "x": 210,
              "y": 210
            }
          }
        },
        {
          "geometry": {
            "start": {
              "x": 210,
              "y": 210
            },
            "end": {
              "x": 300,
              "y": 400
            }
          }
        },
        {
          "geometry": {
            "start": {
              "x": 295,
              "y": 400
            },
            "end": {
              "x": 200,
              "y": 270
            }
          }
        }
      ],
      [
        {
          "geometry": {
            "start": {
              "x": 300,
              "y": 400
            },
            "end": {
              "x": 310,
              "y": 420
            }
          }
        },
        {
          "geometry": {
            "start": {
              "x": 310,
              "y": 420
            },
            "end": {
              "x": 295,
              "y": 400
            }
          }
        }
      ],
      [],
      [],
      []
    ],
    [
      [],
      [],
      [],
      [],
      [],
      []
    ],
    [
      [],
      [],
      [],
      [],
      [],
      []
    ],
    [
      [],
      [],
      [],
      [],
      [],
      []
    ],
    [
      [],
      [],
      [],
      [],
      [],
      []
    ]
  ];

  const actual = city_builder.split_lot(lot)
  await render_square(actual[0][0], 200, 'square.png');	  
  expect(actual).toEqual(expected)

})


it('gets the current square', () => {
  const seed = 1024
  const num_curves = 16
  const city_builder = new CityBuilder(seed, num_curves);
  city_builder.add_grid(200);

  const expected = [
    {top:    {start: {x:0, y:0},   end: {x:200, y:0}},
     bottom: {start: {x:0, y:200}, end: {x:200, y:200}},
     left:   {start: {x:0, y:0},   end: {x:0, y:200}},
     right:  {start: {x:200, y:0},   end: {x:200, y:200}}},
    {top:    {start: {x:200, y:400},   end: {x:400, y:400}},
     bottom: {start: {x:200, y:600},   end: {x:400, y:600}},
     left:   {start: {x:200, y:400},   end: {x:200, y:600}},
     right:  {start: {x:400, y:400},   end: {x:400, y:600}}}
    ]
  
  const actual = city_builder.get_square(0,0)
  expect(actual).toEqual(expected[0])
  const actual_2 = city_builder.get_square(1,2)
  expect(actual_2).toEqual(expected[1])
})

async function render_square(square, size, filename) {
  const hp = require("harry-plotter");
  const bresenham = require("bresenham");

  var plotter = new hp.JimpPlotter(filename, size, size);
  var colour_2 = {red: 0, green: 255, blue: 0};
  var colour_3 = {red: 255, green: 0, blue: 0};
  var colour_4 = {red: 255, green: 0, blue: 0};
  await plotter.init(() => {
    square.forEach(line => {
      var points = bresenham(line.geometry.start.x,
        line.geometry.start.y,
        line.geometry.end.x,
        line.geometry.end.y);
        plotter.plot_points(points, colour_3);
    });
    plotter.write();
  });

}
