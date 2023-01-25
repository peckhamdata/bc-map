const {CityBuilder, 
       shorten_line, 
       right_angle_line,
       inside_lot,
       add_building,
       add_buildings,
       intersects,
       distance_between,
       is_lot_open,
       close_lot } = require("../src/city_builder.js");

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

    const expected = [
      undefined,
      {"edges": [{"geometry": {"end": {"x": 5, "y": 28}, "start": {"x": -1, "y": 26}}, "id": 14, "street_id": 2}, {"geometry": {"end": {"x": 6, "y": 33}, "start": {"x": 5, "y": 28}}, "id": 1, "street_id": 0}], "lot_id": 41, "lot_length": 11}
    ];
    expect(city_builder.lots[1]).toEqual(expected[1]);
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
      lot.edges.forEach((side) => {
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
                     "street_id": 1,
                     "id": 100,
                     "geometry":{"start":{"x":100,"y":100},"end":{"x":200,"y":200}}},
                    {"square":{"x":1, "y":1}, 
                     "street_id": 1,
                     "id": 0,
                     "geometry":{"start":{"x":200,"y":200},"end":{"x":300,"y":300}}}];
  const actual = city_builder.line_to_squares({
    "street_id": 1,
    "id": 100,
    "geometry":{"start":{"x":100,"y":100},"end":{"x":300,"y":300}}});
  expect(actual).toEqual(expected);
})

it('splits a line across multiple squares right to left', () => {
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);

  const expected = [{"square":{"x":1, "y":2}, 
                     "street_id": 1,
                     "id": 100,
                     "geometry":{"start":{"x":310,"y":420},"end":{"x":295,"y":400}}}, 
                    {"square":{"x":1, "y":1},
                     "street_id": 1,
                     "id": 0,
                     "geometry":{"start":{"x":295,"y":400},"end":{"x":200,"y":270}}},
                    {"square":{"x":0, "y":1},
                     "street_id": 1,
                     "id": 1,
                     "geometry":{"start":{"x":200,"y":270},"end":{"x":148,"y":200}}},
                    {"square":{"x":0, "y":0},
                     "street_id": 1,
                     "id": 2,
                     "geometry":{"start":{"x":148,"y":200},"end":{"x":10,"y":10}}}                    
                    ];
  const actual = city_builder.line_to_squares({
    "street_id": 1,
    "id": 100,
    "geometry":{"start":{"x":310,"y":420},"end":{"x":10,"y":10}}});
  expect(actual).toEqual(expected);
})

it('splits a lot across multiple squares', async () => {
  const lot = {
    lot_id: 1,
    lot_length: 100,
    edges: [
    {id: 1, 
     street_id: 2,
     geometry: {start: {x: 10, y:10},
                end:   {x: 210, y: 210}}},
    {id: 2,
     street_id: 3,
     geometry: {start: {x: 210, y:210},
                end:   {x: 310, y: 420}}},
    {id: 3,
     street_id: 4,
     geometry: {start: {x: 310, y:420},
                end:   {x: 10, y: 10}}}]
  }
  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);
  city_builder.add_grid(200);
  const expected = [undefined,
    [[], [{"geometry": {"end": {"x": 210, "y": 210}, "start": {"x": 200, "y": 200}}, "id": 0, "lot_id": 1, "lot_length": 100, "street_id": 2}, {"geometry": {"end": {"x": 300, "y": 400}, "start": {"x": 210, "y": 210}}, "id": 2, "lot_id": 1, "lot_length": 100, "street_id": 3}, {"geometry": {"end": {"x": 200, "y": 270}, "start": {"x": 295, "y": 400}}, "id": 4, "lot_id": 1, "lot_length": 100, "street_id": 4}], [{"geometry": {"end": {"x": 310, "y": 420}, "start": {"x": 300, "y": 400}}, "id": 2, "lot_id": 1, "lot_length": 100, "street_id": 3}, {"geometry": {"end": {"x": 295, "y": 400}, "start": {"x": 310, "y": 420}}, "id": 3, "lot_id": 1, "lot_length": 100, "street_id": 4}], [], [], []]
  ]


  const actual = city_builder.split_lot(lot)
  await render_square(actual[0][0], 200, 'square.png');	  
  expect(actual[1]).toEqual(expected[1])

})

it('gets lot length', () => {

  const lot = [
    {
      "id": 22,
      "street_id": 3,
      "geometry": {
        "start": {
          "x": 43,
          "y": 0
        },
        "end": {
          "x": 47,
          "y": 43
        }
      }
    },
    {
      "id": 20,
      "street_id": 2,
      "geometry": {
        "start": {
          "x": 27,
          "y": 34
        },
        "end": {
          "x": 47,
          "y": 43
        }
      }
    },
    {
      "id": 11,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 27,
          "y": 0
        },
        "end": {
          "x": 27,
          "y": 34
        }
      }
    }
  ]

  const seed = 1024
  const num_curves = 16
  const scale = 1
  const city_builder = new CityBuilder(seed, num_curves, scale);

  const actual = city_builder.lot_length(lot);
  expect(actual).toEqual(98);
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

it('finds a point N pixels along a line', async () => {

  const line = {geometry: {start: {x:0, y:0}, 
                           end:   {x:100, y: 120}}}

  const expected = { geometry: {start: {x: 0, y: 0}, end: {x: 32, y: 38 }}}                         
  const actual = shorten_line(line, 50);
  expect(actual).toEqual(expected);                           
})

it('makes a line at a right angle to this one', async () => {
  const line = { geometry: {start: {x: 0, y: 0}, end: {x: 132, y: 138 }}}                         
  const expected = [{"geometry":{"start":{"x":48,"y":50},"end":{"x":33,"y":63}}},{"geometry":{"start":{"x":48,"y":50},"end":{"x":62,"y":36}}}]
  let actual = right_angle_line(line, 20, 70);

  // Lets look at what the actual looks like

  const filename = 'right_angle.png'
  const all_lines = [].concat(actual)
  all_lines.push(line)
  await render_square(all_lines, 250, filename);
  expect(actual).toEqual(expected);

})

it('sees if right angle line interects with a lot edge', async () => {
  let lot = [
    {
      "id": 22,
      "street_id": 3,
      "geometry": {
        "start": {
          "x": 10,
          "y": 10
        },
        "end": {
          "x": 200,
          "y": 20
        }
      }
    },
    {
      "id": 20,
      "street_id": 2,
      "geometry": {
        "start": {
          "x": 200,
          "y": 20
        },
        "end": {
          "x": 200,
          "y": 200
        }
      }
    },
    {
      "id": 11,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 200,
          "y": 200
        },
        "end": {
          "x": 50,
          "y": 100
        }
      }
    },
    {
      "id": 11,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 50,
          "y": 100
        },
        "end": {
          "x": 10,
          "y": 10
        }
      }
    }
  ]

  let all_perps = []
  lot.forEach((edge, i) => {
    const perps = right_angle_line(edge, 100, 50)
    // expect(inside_lot(perps[0], lot)).toBeTruthy();
    // expect(inside_lot(perps[1], lot)).toEqual(false);
    if (inside_lot(perps[0], lot, i)) {
      all_perps.push(perps[0])
    }
    if (inside_lot(perps[1], lot, i)) {
      all_perps.push(perps[1])
    }
  
  })
  let all_lines = [].concat(all_perps, lot)
  await render_square(all_lines, 255, "assets/building_edges.png");
  
})

it('adds buildings to the lot', async() => {

  let lot_edges = [
    {
      "id": 22,
      "street_id": 3,
      "geometry": {
        "start": {
          "x": 10,
          "y": 10
        },
        "end": {
          "x": 200,
          "y": 20
        }
      }
    },
    {
      "id": 20,
      "street_id": 2,
      "geometry": {
        "start": {
          "x": 200,
          "y": 20
        },
        "end": {
          "x": 200,
          "y": 200
        }
      }
    },
    {
      "id": 11,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 200,
          "y": 200
        },
        "end": {
          "x": 50,
          "y": 100
        }
      }
    },
    {
      "id": 12,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 50,
          "y": 100
        },
        "end": {
          "x": 10,
          "y": 10
        }
      }
    }
  ]
  let buildings = []
  lot_edges.forEach((edge, i) => {

    const length = distance_between(edge.geometry.start.x,
                                      edge.geometry.start.y,
                                      edge.geometry.end.x,
                                      edge.geometry.end.y)
    let start = 10
    let end = 2
    do {
      const building = add_building(lot_edges, i, start, end)
      if (!intersects(building, buildings)) {
        buildings = buildings.concat(building)
      }
      start = end + 1
      end += 20
    } while(end <= length);

  })
  await render_square(buildings, 250, "assets/lot_with_buildings.png");
})

it('adds many buildings to the lot', async() => {

  let lot = [
    {
      "id": 22,
      "street_id": 3,
      "geometry": {
        "start": {
          "x": 10,
          "y": 10
        },
        "end": {
          "x": 200,
          "y": 20
        }
      }
    },
    {
      "id": 20,
      "street_id": 2,
      "geometry": {
        "start": {
          "x": 200,
          "y": 20
        },
        "end": {
          "x": 200,
          "y": 200
        }
      }
    },
    {
      "id": 11,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 200,
          "y": 200
        },
        "end": {
          "x": 50,
          "y": 100
        }
      }
    },
    {
      "id": 12,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 50,
          "y": 100
        },
        "end": {
          "x": 10,
          "y": 10
        }
      }
    }
  ]
  
  const buildings = add_buildings(lot, 10)
  await render_square(buildings, 250, "assets/lot_with_many_buildings.png");

})

it('checks to see if a shape overlaps with any shapes in a list of shapes', () => {
  const building = [
    {geometry: {start: {x:10,  y: 10},
                end:   {x:100, y: 10}}},
    {geometry: {start: {x:100, y: 10},
                end:   {x:100, y: 100}}},
    {geometry: {start: {x:100, y: 100},
                end:   {x:10,  y: 10}}}            
  ]

  const existing = [
    {geometry: {start: {x:30,  y: 10},
                end:   {x:130, y: 10}}},
    {geometry: {start: {x:130, y: 10},
                end:   {x:130, y: 100}}},
    {geometry: {start: {x:130, y: 100},
                end:   {x:30,  y: 10}}}            

  ]
  expect(intersects(building, existing)).toEqual(true)
})

it('deals with this one found in the wild', async() => {
  const scale = 1
  const lot = {
    "lot_id": 30930,
    "lot_length": 2313,
    "edges": [
      {
        "id": 9907,
        "street_id": 376,
        "geometry": {
          "start": {
            "x": Math.floor(992 / scale),
            "y": Math.floor(413 / scale)
          },
          "end": {
            "x": Math.floor(1846 / scale),
            "y": Math.floor(882 / scale)
          }
        }
      },
      {
        "id": 9842,
        "street_id": 375,
        "geometry": {
          "start": {
            "x": Math.floor(1846 / scale),
            "y": Math.floor(882 / scale)
          },
          "end": {
            "x": Math.floor(1950 / scale),
            "y": Math.floor(981 / scale)
          }
        }
      },
      {
        "id": 9443,
        "street_id": 357,
        "geometry": {
          "start": {
            "x": Math.floor(1093 / scale),
            "y": Math.floor(588 / scale)
          },
          "end": {
            "x": Math.floor(1950 / scale),
            "y": Math.floor(981 / scale)
          }
        }
      },
      {
        "id": 9346,
        "street_id": 356,
        "geometry": {
          "start": {
            "x": Math.floor(951 / scale),
            "y": Math.floor(473 / scale)
          },
          "end": {
            "x": Math.floor(1093 / scale),
            "y": Math.floor(588 / scale)
          }
        }
      },
      {
        "id": 1519,
        "street_id": 74,
        "geometry": {
          "start": {
            "x": Math.floor(992 / scale),
            "y": Math.floor(413 / scale)
          },
          "end": {
            "x": Math.floor(951 / scale),
            "y": Math.floor(473 / scale)
          }
        }
      }
    ]
  }

  const seed = 1024
  const num_curves = 16
  const city_builder = new CityBuilder(seed, num_curves);
  // console.log(JSON.stringify(lot.edges[2]))
  const buildings = add_building(lot.edges, 2, 100, 120)
  const lines = right_angle_line(lot.edges[2], 1000, 0);
  // console.log("right angles:" + JSON.stringify(lines))
  const hits = inside_lot(lines[1], lot.edges, 1)

  // Shorten line so it fits inside lot
  let length = distance_between(lines[1].geometry.start.x,
                                lines[1].geometry.start.y,      
                                hits[0].x,
                                hits[0].y) / 4
  // console.log(hits)
  // console.log(length)
  const short_line = shorten_line(lines[1], length)
  // console.log(short_line)
  await render_square(lot.edges.concat(short_line), 2000, "wild.png");

})

it('closes an open lot', async() => {

  let open_lot = [
    {
      "id": 22,
      "street_id": 3,
      "geometry": {
        "start": {
          "x": 10,
          "y": 10
        },
        "end": {
          "x": 200,
          "y": 20
        }
      }
    },
    {
      "id": 20,
      "street_id": 2,
      "geometry": {
        "start": {
          "x": 200,
          "y": 20
        },
        "end": {
          "x": 200,
          "y": 200
        }
      }
    },
    {
      "id": 11,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 200,
          "y": 200
        },
        "end": {
          "x": 50,
          "y": 100
        }
      }
    }
  ]

  let closed_lot = [
    {
      "id": 22,
      "street_id": 3,
      "geometry": {
        "start": {
          "x": 10,
          "y": 10
        },
        "end": {
          "x": 200,
          "y": 20
        }
      }
    },
    {
      "id": 20,
      "street_id": 2,
      "geometry": {
        "start": {
          "x": 200,
          "y": 20
        },
        "end": {
          "x": 200,
          "y": 200
        }
      }
    },
    {
      "id": 11,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 200,
          "y": 200
        },
        "end": {
          "x": 50,
          "y": 100
        }
      }
    },
    {
      "id": 12,
      "street_id": 1,
      "geometry": {
        "start": {
          "x": 50,
          "y": 100
        },
        "end": {
          "x": 10,
          "y": 10
        }
      }
    }
  ]

  const line = is_lot_open(open_lot)
  open_lot.push(line)
  await render_square(open_lot, 255, "closed_lot.png");
  
})

it('deals with this wild one', async() => {

  const lot_edges = [{"id":2994,"street_id":243,"geometry":{"start":{"x":1174,"y":857},"end":{"x":908,"y":931}}},{"id":3142,"street_id":263,"geometry":{"start":{"x":1174,"y":857},"end":{"x":1461,"y":1231}}},{"id":2782,"street_id":224,"geometry":{"start":{"x":1461,"y":1231},"end":{"x":799,"y":1150}}},{"geometry":{"start":{"x":908,"y":931},"end":{"x":799,"y":1150}}}]
  const size = 20
  const far_away = 1000
  let buildings = []

  function building_right_angle(edge, edge_index, far_away, start) {
      // Get right angles along the lot edge
      const right_angle_lines = right_angle_line(edge, far_away, start)

      // Test if line one is inside the lot
      const left_hits = inside_lot(right_angle_lines[0], lot_edges, edge_index)
      if (left_hits.length > 0) {

        let inside_line = {geometry: {start: right_angle_lines[0].geometry.start, 
                                      end:   left_hits[0]}}
        let length = distance_between(inside_line.geometry.start.x,
                                      inside_line.geometry.start.y,      
                                      inside_line.geometry.end.x,
                                      inside_line.geometry.end.y) / 4
    
        return shorten_line(inside_line, length)
    
      } else {
        const right_hits = inside_lot(right_angle_lines[1], lot_edges, edge_index)
        if (right_hits.length > 0) {
  
          let inside_line = {geometry: {start: right_angle_lines[1].geometry.start, 
                                        end:   right_hits[0]}}
          let length = distance_between(inside_line.geometry.start.x,
                                        inside_line.geometry.start.y,      
                                        inside_line.geometry.end.x,
                                        inside_line.geometry.end.y) / 4
      
          return shorten_line(inside_line, length)
      
        }
      }

  }
  lot_edges.forEach((edge, edge_index) => {

    const length = distance_between(edge.geometry.start.x,
                                      edge.geometry.start.y,
                                      edge.geometry.end.x,
                                      edge.geometry.end.y)
    let start = 10
    let end = 2
    do {

      const left_line = building_right_angle(edge, edge_index, far_away, start)
      if (left_line !== undefined) {
        buildings.push(left_line)
      }

      const right_line = building_right_angle(edge, edge_index, far_away, end)
      if (right_line !== undefined) {
        buildings.push(right_line)
      }

      if (left_line !== undefined && right_line !== undefined) {
        buildings.push({geometry: {start: left_line.geometry.end,
                                  end:   right_line.geometry.end}})  

      }

      start = end + 1
      end += size
    } while(end <= length);

  })
  await render_square(buildings, 2000, "wild_too.png");

})


async function render_square(square, size, filename) {
  const hp = require("harry-plotter");
  const bresenham = require("bresenham");

  var plotter = new hp.JimpPlotter(filename, size, size);
  await plotter.init(() => {
    square.forEach(line => {
      var colour = {red:   Math.floor(Math.random() * 255), 
        green: Math.floor(Math.random() * 255),
        blue:  Math.floor(Math.random() * 255)};
      var points = bresenham(line.geometry.start.x,
        line.geometry.start.y,
        line.geometry.end.x,
        line.geometry.end.y);
        plotter.plot_points(points, colour);
    });
    plotter.write();
  });

}

