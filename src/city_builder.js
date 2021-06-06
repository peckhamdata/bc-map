const Bezier = require('bezier-js');

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect

function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false
    }

    denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    // Lines are parallel
    if (denominator === 0) {
        return false
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false
    }

    // Return a object with the x and y coordinates of the intersection
    let x = Math.floor(x1 + ua * (x2 - x1));
    let y = Math.floor(y1 + ua * (y2 - y1));

    return {x, y}
}

// Draw line parallel to another from https://stackoverflow.com/a/63538916/1064619

function parallel(line, offset = 0) {
    var [ox, oy] = [0, 0];
    if (offset) {
        const [dx, dy] = [line.start.x - line.end.x, line.start.y - line.end.y];
        const scale = offset / (dx * dx + dy * dy) ** 0.5;
        [ox, oy] = [-dy * scale, dx * scale];
    }
    return ({geometry: {
             start: {x: Math.floor(ox + line.start.x), y: Math.floor(oy + line.start.y)},
               end: {x: Math.floor(ox + line.end.x), y: Math.floor(oy + line.end.y)}}})
}

// Sort them based on distance from the start of the line:
// https://stackoverflow.com/a/20916980/1064619

function distance_between(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;

  var c = Math.sqrt( a*a + b*b );
  return Math.floor(c);
}

module.exports = class CityBuilder {
  constructor(seed, num_curves, scale) {
    this.seed = seed
    this.scale = scale
    this.magic = this.seed / 2
    this.num_curves = num_curves
    this.next_street = -1;
    this.curve_num_points = this.seed

    this.bezier_sequence = this.lcg_sequence(this.magic,
                                             this.magic,
                                             0,
                                             this.magic).
    slice(0, num_curves).sort((a, b) => a - b);
    this.bezier_streets = [];
    this.diagonal_streets = [];
    this.cross_streets = [];
    this.streets = [];
    this.lot_edges = [];
    // Internal
    this.cols = []
  }

  // TODO: Decide where the LCG Sequence generator belongs
  lcg_sequence(seed, max, min, length) {
      max = max || 1;
      min = min || 0;
      var result = []
      var i=0;
      for (i=0; i < length; i++) {
          seed = (seed * 9301 + 49297) % 233280;
          var rnd = seed / 233280;

          result.push(min + rnd * (max - min));
          seed++
      }
      return result;
  }

  circle(radius) {
    var offset = (this.seed / 2) * this.scale
    var pointAngleInRadians = 0;
    var points = [];
    for (pointAngleInRadians = 0;
         pointAngleInRadians <= 7;
         pointAngleInRadians+=(Math.PI/360)) {
      var x = Math.cos(pointAngleInRadians) * radius;
      var y = Math.sin(pointAngleInRadians) * radius;
      points.push({x: x + offset, y: y + offset})
    }
    return points
  }

  street_id() {
    this.next_street++;
    return this.next_street;
  }

  build_bezier_streets() {

    var circle_points = this.circle((this.seed / 2) * this.scale)
    var inner_circle = this.circle((this.seed / 2 - 128) * this.scale) // #MAGIC
    var circle_offset = Math.floor(circle_points.length / 8) // #MAGIC
    var inner_circle_length = inner_circle.length
    circle_points.push(...circle_points)
    // TODO: Sort out this #HACK
    circle_points.push(...circle_points)
    circle_points.push(...circle_points)
    inner_circle.push(...inner_circle)
    inner_circle.push(...inner_circle)
    inner_circle.push(...inner_circle)

    var i = 0
    var j = 0
    for (i=0; i < this.num_curves; i+=1) {
      var here = Math.floor(this.bezier_sequence[i]) +50
      var there = here + Math.floor(inner_circle_length / 2)
      var curve = {start:   {x: circle_points[here].x,
                             y: circle_points[here].y},
                   control: {x: inner_circle[there].x,
                             y: inner_circle[there].y},
                   end:     {x: circle_points[here+circle_offset].x,
                             y: circle_points[here+circle_offset].y}};
      // console.log('adding bezier street ' + i + ' of ' + this.num_curves);
      this.bezier_streets.push({id: this.street_id(),
                                type: 'bezier',
                                geometry: curve,
                                junctions: []})
    }
  }

  build_diagonal_streets() {

    for (var i=1; i < this.num_curves; i++) {
      var lines = [];
      // #MAGIC
      for (var j=0; j < this.curve_num_points - 100; j+=50) {
        var k=j // Math.floor(line_nums[j]);
        var offset=100; // Math.floor(offset_nums[j]);
        var curve = new Bezier(this.bezier_streets[i].geometry.start.x,
                               this.bezier_streets[i].geometry.start.y,
                               this.bezier_streets[i].geometry.control.x,
                               this.bezier_streets[i].geometry.control.y,
                               this.bezier_streets[i].geometry.end.x,
                               this.bezier_streets[i].geometry.end.y)
        var prev_curve = new Bezier(this.bezier_streets[i].geometry.start.x,
                               this.bezier_streets[i-1].geometry.start.y,
                               this.bezier_streets[i-1].geometry.control.x,
                               this.bezier_streets[i-1].geometry.control.y,
                               this.bezier_streets[i-1].geometry.end.x,
                               this.bezier_streets[i-1].geometry.end.y)
        var curve_points = curve.getLUT(this.curve_num_points)
        var prev_curve_points = prev_curve.getLUT(this.curve_num_points)
        var street = {id: this.street_id(),
                      type: 'bresenham',
                      junctions: [],
                      geometry: {start: {x: curve_points[k].x,
                                         y: curve_points[k].y},
                                 end:   {x: prev_curve_points[k+offset].x,
                                         y: prev_curve_points[k+offset].y}}}
        // console.log('adding diagonal street:' + i + '/' + this.num_curves + ':' + j + '/' + this.curve_num_points)
        this.streets.push(street)
        this.diagonal_streets.push(street)
        lines.push(street)
      }
      this.cols.push(lines)
    }
  }

  build_cross_streets() {
    var counter = 0;
    var colour_index = 0;
    for (var c=1; c < this.cols.length; c++) {
      var col = this.cols[c];
      var col_p = this.cols[c-1];
      for (var l=0; l < col.length; l++) {
       var street = {id: this.street_id(),
                    type: 'bresenham',
                    junctions: [],
                    geometry: {start: {x: col_p[l].geometry.start.x,
                                       y: col_p[l].geometry.start.y},
                               end:   {x: col[l].geometry.start.x,
                                       y: col[l].geometry.start.y}}}
       console.log('adding cross street:' + c + '/' + this.cols.length + ':' + l + '/' + col.length);
       this.streets.push(street)
       this.cross_streets.push(street)
      }
      var final = col_p[l-1].length
       var final_street = {id: this.street_id(),
                    type: 'bresenham',
                    junctions: [],
                    geometry: {start: {x: col_p[l-1].geometry.end.x,
                                       y: col_p[l-1].geometry.end.y},
                               end:   {x: col[l-1].geometry.end.x,
                                       y: col[l-1].geometry.end.y}}}
       this.streets.push(final_street)
       this.cross_streets.push(final_street)

    }
  }

  flip_y() {
    this.streets.forEach((street) => {
      let ox = street.geometry.start.x;
      let oy = street.geometry.start.y;
      if (oy > street.geometry.end.y) {
        street.geometry.start.y = street.geometry.end.y;
        street.geometry.start.x = street.geometry.end.x;

        street.geometry.end.y = oy;
        street.geometry.end.x = ox;
      }
    });
  }

  add_parallels(offset) {
    this.streets.forEach((street) => {
      if (street.edges === undefined) {
        street.edges = {plus: undefined, minus: undefined};
      }
      street.edges.plus = parallel(street.geometry, offset);
      street.edges.minus = parallel(street.geometry, -Math.abs(offset));
    });
  }

  add_junctions() {
      // For each street
      this.streets.forEach((from_street) => {
          this.streets.forEach((to_street) => {
              if (from_street.id !== to_street.id) {
                  const junction = intersect(from_street.geometry.start.x,
                      from_street.geometry.start.y,
                      from_street.geometry.end.x,
                      from_street.geometry.end.y,
                      to_street.geometry.start.x,
                      to_street.geometry.start.y,
                      to_street.geometry.end.x,
                      to_street.geometry.end.y);
                  if (junction !== false) {
                      if (from_street.junctions === undefined) {
                        from_street.junctions = [];
                      }
                      from_street.junctions.push({street_id: to_street.id, x: junction.x, y: junction.y});
                  }
              }
          })
      })
  }

  sort_junctions(street) {
    street.junctions.forEach((junction) => {
      junction.distance = distance_between(street.geometry.start.x,
                                           street.geometry.start.y,
                                           junction.x, junction.y);
    })
    street.junctions.sort((first, second) => {
      if (first.distance < second.distance) {
        return -1;
      }
      if (first.distance > second.distance) {
        return 1;
      }
      return 0;
    });
  }

  intersect_parallels() {
    const edges = ['minus', 'plus'];
    edges.forEach((edge) => {
      this.streets.forEach((from_street) => {
        from_street.edges[edge].junctions = []
        this.streets.forEach((to_street) => {
          edges.forEach((to_edge) => {
            if (from_street.id !== to_street.id) {
              const junction = intersect(from_street.edges[edge].geometry.start.x,
                from_street.edges[edge].geometry.start.y,
                from_street.edges[edge].geometry.end.x,
                from_street.edges[edge].geometry.end.y,
                to_street.edges[to_edge].geometry.start.x,
                to_street.edges[to_edge].geometry.start.y,
                to_street.edges[to_edge].geometry.end.x,
                to_street.edges[to_edge].geometry.end.y);
              if (junction !== false) {
                from_street.edges[edge].junctions.push({
                  street_id: to_street.id,
                  x: junction.x,
                  y: junction.y,
                  edge: to_edge
                });
              }
            }
          });
        });
        this.streets.forEach((to_street) => {
          if (from_street.id !== to_street.id) {
            const junction = intersect(from_street.edges[edge].geometry.start.x,
              from_street.edges[edge].geometry.start.y,
              from_street.edges[edge].geometry.end.x,
              from_street.edges[edge].geometry.end.y,
              to_street.geometry.start.x,
              to_street.geometry.start.y,
              to_street.geometry.end.x,
              to_street.geometry.end.y);
            if (junction !== false) {
              from_street.edges[edge].junctions.push({street_id: to_street.id, x: junction.x, y: junction.y, edge: 'centre'});
            }
          }
        });
        this.sort_junctions(from_street.edges[edge]);
      });
    });
  }

  split_streets() {
    const edges = ['minus', 'plus'];
    this.streets.forEach((street) => {
      edges.forEach((edge) => {
        if (street.edges[edge].junctions.length > 0) {
          if (street.edges[edge].junctions[0].distance !== 0) {
            if (edge === 'minus') {
              this.lot_edges.push({
                geometry: {
                  start: {
                    x: street.edges.minus.geometry.start.x,
                    y: street.edges.minus.geometry.start.y
                  },
                  end: {
                    x: street.edges.plus.geometry.start.x,
                    y: street.edges.plus.geometry.start.y
                  }
                }
              });
            }
          }
          if (street.edges[edge].junctions[street.edges[edge].junctions.length-1].distance !== 0) {
            if (edge === 'minus') {
              this.lot_edges.push({
                geometry: {
                  start: {
                    x: street.edges.minus.geometry.end.x,
                    y: street.edges.minus.geometry.end.y
                  },
                  end: {
                    x: street.edges.plus.geometry.end.x,
                    y: street.edges.plus.geometry.end.y
                  }
                }
              });
            }
          }
        }

        let start = {
          x: street.edges[edge].geometry.start.x,
          y: street.edges[edge].geometry.start.y
        };
        let end = {
          x: street.edges[edge].geometry.end.x,
          y: street.edges[edge].geometry.end.y
        };
        let state = 'seek_end';

        street.edges[edge].junctions.forEach((junction, idx) => {
          if (junction.edge === 'centre') {
            state = 'seek_start';
          } else {
            if (state === 'seek_end') {
              // reached a junction so set end to intersect
              end = {x: junction.x, y: junction.y};
              this.lot_edges.push({geometry: {start: start, end: end}});
            } else {
              start = {x: junction.x, y: junction.y};
              state = 'seek_end';
            }
          }
        });
        if (state === 'seek_end') {
          this.lot_edges.push({geometry: {
              start: start,
              end: {
                x: street.edges[edge].geometry.end.x,
                y: street.edges[edge].geometry.end.y
              }}
          });
        }
      });
    });
  }

  get_street(id) {
    return this.streets.filter(obj => {
      return obj.id === parseInt(id, 0)
    });
  }
}


// if (split) {
//   end = {x: junction.x, y: junction.y};
//   this.lot_edges.push({
//     geometry: {
//       start: start,
//       end: end
//     }
//   });
// } else {
//   start = {x: junction.x, y: junction.y};
// }
// split = !(split);
// });
// if (split) {
//   this.lot_edges.push({
//     geometry: {
//       start: start,
//       end: {
//         x: street.edges[edge].geometry.end.x,
//         y: street.edges[edge].geometry.end.y
//       }
//     }
//   });

// let start = {x: street.edges[edge].geometry.start.x,
//   y: street.edges[edge].geometry.start.y};
// let end;
// street.edges[edge].junctions.forEach((junction, idx) => {
//   if (idx < street.edges[edge].junctions.length -1) {
//     if (junction.edge !== 'centre') {
//       if (street.edges[edge].junctions[idx + 1].edge === 'centre') {
//         // next junction is the intersecting road so split here
//         end = {x: junction.x, y: junction.y}
//         this.lot_edges.push({geometry: {start: start, end: end}})
//       }
//     } else {
//       start = {x: junction.x, y: junction.y}
//     }
//   } else {
//     end = {x: street.edges[edge].geometry.end.x,
//       y: street.edges[edge].geometry.end.y};
//     this.lot_edges.push({geometry: {start: start, end: end}})
//   }
// });
