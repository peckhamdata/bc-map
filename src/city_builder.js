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
    this.size = seed * scale
    this.magic = this.seed / 2
    this.num_curves = num_curves
    this.next_street = -1;
    this.curve_num_points = this.seed
    this.verbose = false

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
    this.lots = [];
    this.grid = {x: [], y: []};
    this.squares = [[]];
    this.splits;
    // Internal
    this.cols = [];
    this.width = undefined;
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
       // console.log('adding cross street:' + c + '/' + this.cols.length + ':' + l + '/' + col.length);
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
      const street_id = street.id
      edges.forEach((edge) => {

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
              this.lot_edges.push({ id: this.street_id(),
                                    street_id: street_id,
                                    geometry: {start: start, end: end}});
            } else {
              start = {x: junction.x, y: junction.y};
              state = 'seek_end';
            }
          }
        });
         if (state === 'seek_end') {
          this.lot_edges.push({
              id: this.street_id(),
              street_id: street_id,
              geometry: {
                start: start,
                end: {
                  x: street.edges[edge].geometry.end.x,
                  y: street.edges[edge].geometry.end.y
                }
              }
            }
           );
         }
      });
    });
  }



  get_street(id) {
    return this.streets.filter(obj => {
      return obj.id === parseInt(id, 0)
    });
  }

  add_lots() {
    let used_ids = [];
    let edges = this.lot_edges;

    const get_neighbour = function(from_edge) {
      used_ids.push(from_edge.id);
      for (let i=0; i < edges.length; i++) {
        if (!used_ids.includes(edges[i].id)) {
	  let match = intersect(from_edge.geometry.start.x,
	                        from_edge.geometry.start.y,
	                        from_edge.geometry.end.x,
	                        from_edge.geometry.end.y,
	                        edges[i].geometry.start.x,
	                        edges[i].geometry.start.y,
	                        edges[i].geometry.end.x,
	                        edges[i].geometry.end.y)  
          if (match !== false) {
            let neighbour = get_neighbour(edges[i]);
            neighbour.push(from_edge)
            return neighbour;
	  }	    
        }
      }
      return [from_edge];
    }
   
    this.lot_edges.forEach((edge, idx) => {
      if (this.verbose) {
        console.log('adding  edge ' + idx + ' of ' + this.lot_edges.length);
      }
      const neighbours = get_neighbour(edge);	    
      if (neighbours.length > 1) {
        const lot_length = this.lot_length(neighbours);
        this.lots.push({lot_id: this.street_id(),
                        lot_length: lot_length,
                        edges: neighbours});
      }	      
    })
  }

  find_in_square(line, square) {

    let x_end;
    let y_end;
    let top = false;
    let bottom = false;
    let left = false;
    let right = false;

    const hits_top = intersect(line.geometry.start.x,
          line.geometry.start.y,
          line.geometry.end.x,
          line.geometry.end.y,
          square.top.start.x,
          square.top.start.y,
          square.top.end.x,
          square.top.end.y)

    const hits_bottom = intersect(line.geometry.start.x,
          line.geometry.start.y,
          line.geometry.end.x,
          line.geometry.end.y,
          square.bottom.start.x,
          square.bottom.start.y,
          square.bottom.end.x,
          square.bottom.end.y)

    const hits_left = intersect(line.geometry.start.x,
          line.geometry.start.y,
          line.geometry.end.x,
          line.geometry.end.y,
          square.left.start.x,
          square.left.start.y,
          square.left.end.x,
          square.left.end.y)

    const hits_right = intersect(line.geometry.start.x,
            line.geometry.start.y,
            line.geometry.end.x,
            line.geometry.end.y,
            square.right.start.x,
            square.right.start.y,
            square.right.end.x,
            square.right.end.y)

    if (hits_top) {
      top = true;
      if (hits_top.x !== line.geometry.start.x & hits_top.y !== line.geometry.start.y) {
        x_end = hits_top.x;
        y_end = hits_top.y;
      } 
    }

    if (hits_bottom) {
      bottom = true;
      // console.log(hits_bottom)
      if (hits_bottom.x !== line.geometry.start.x & hits_bottom.y !== line.geometry.start.y) {
        x_end = hits_bottom.x;
        y_end = hits_bottom.y;
      } else {
        x_end = line.geometry.end.x;
        y_end = line.geometry.end.y;
      }
    }

    if (hits_left) {
      left = true;
      if (hits_left.x !== line.geometry.start.x & hits_left.y !== line.geometry.start.y) {
        x_end = hits_left.x;
        y_end = hits_left.y;
      }

    }

    if (hits_right) {
      right = true;
      if (hits_right.x !== line.geometry.start.x & hits_right.y !== line.geometry.start.y) {
        x_end = hits_right.x;
        y_end = hits_right.y;
      }
    }

    return {x:x_end, y: y_end, hits_top: top, hits_left: left, hits_right: right, hits_bottom: bottom}
  }

  split_line(line) {

    // Find which square the line starts in
      
    for (var x=0; x < this.grid.x.length; x++) {
      if (line.geometry.start.x < this.grid.x[x].geometry.start.x) {
        break;
      }
    }
    for (var y=0; y < this.grid.y.length; y++) {
      if (line.geometry.start.y < this.grid.y[y].geometry.start.y) {
        break;
      }
    }

    let x_column = x - 1;
    let y_column = y - 1;
    let end;

    let square = this.get_square(x_column, y_column);
    end = this.find_in_square(line, square); // TODO: Rename to find exits
    if (!end.x && !end.y) {

      // Check if line ends within square bounds   
      // console.log("end", end)
      // console.log("line", line)
      // console.log("square", square)

      // console.log(line.geometry.end.x, square.left.start.x)
      // console.log(line.geometry.end.x, square.right.start.x)
      // console.log(line.geometry.end.y, square.top.start.y)
      // console.log(line.geometry.end.y, square.bottom.start.y)

      if (line.geometry.end.x > square.left.start.x &&
          line.geometry.end.x < square.right.start.x &&
          line.geometry.end.y > square.top.start.y &&
          line.geometry.end.y < square.bottom.start.y) {
        end.x = line.geometry.end.x;
        end.y = line.geometry.end.y;
      } else {
        // If line exited via the top, look in the square above
        if (end.hits_top) {
          y_column--
          square = this.get_square(x_column, y_column);
          end = this.find_in_square(line, square);  
          // console.log(end)
        } else if (end.hits_bottom) {
          y_column++
          square = this.get_square(x_column, y_column);
          end = this.find_in_square(line, square);  
        } else if (end.hits_left) {
          x_column--
          square = this.get_square(x_column, y_column);
          end = this.find_in_square(line, square);  
        } else {
          x_column++
          square = this.get_square(x_column, y_column);
          end = this.find_in_square(line, square);  
        }
      }
    }
    
    return {"square": {"x": x_column, "y": y_column},
            "street_id": line.street_id,
            "id": line.id, 
            "geometry": {"start": {"x": line.geometry.start.x,
                                   "y": line.geometry.start.y}, 
                         "end":   {"x": end.x,
                                   "y": end.y}}};
  }

  line_to_squares(line) {
    let sections = [];
    let old_line;
    let i = 0;
    const parent_id = line.id;
    while (i < 10) {
      i++;
      // console.log('line:    ', line);
      console.log("line_to_squares:line:" + JSON.stringify(line))
      const section = this.split_line(line); 
      console.log("line_to_squares:section:"+ JSON.stringify(section))
      // console.log('section:', section)
      if (section.geometry.start.x == section.geometry.end.x && 
          section.geometry.start.y == section.geometry.end.y) {
        break;
      }
      sections.push(section);
      old_line = line;
      line = {street_id: old_line.street_id,
              parent_id: parent_id,
              id: this.street_id(),
              geometry: {start: {x: section.geometry.end.x,
                                 y: section.geometry.end.y},
                         end:   {x: old_line.geometry.end.x,
                                 y: old_line.geometry.end.y}}}
      if (line.geometry.start.x == line.geometry.end.x &&
          line.geometry.start.y == line.geometry.end.y) {
        break;
      }                           
    }
    return sections;
  }

  split_lot(lot) {

    lot.edges.forEach((line) => {
      console.log("split_lot:line:" + JSON.stringify(line))
      const sections = this.line_to_squares(line);
      console.log("split_lot:sections:" + JSON.stringify(sections))
      sections.forEach((section) => {
        // TODO: IDs need to be preserved
        try {
          this.splits[section.square.x][section.square.y].push({lot_id: lot.lot_id,
                                                                lot_length: lot.lot_length,
                                                                geometry: section.geometry})
        } catch (err) {
          console.log(err, section)
        }
      })
    })
    return this.splits;
  }

  add_grid(width) {
    this.width = width
    for (var x=0; x <= this.size; x+=this.width) {
      this.grid.x.push({geometry: {start: {x: x, y: 0},
                                   end: {x: x, y: this.size}}})
    }    
    for (var y=0; y <= this.size; y+=this.width) {
      this.grid.y.push({geometry: {start: {x: 0, y: y},
        end: {x: this.size, y: y}}})
    } 

    const size = this.grid.x.length;
    this.splits = new Array(size)
    for (var i = 0; i < size; i++) {
      this.splits[i] = new Array(size)
      for (var j = 0; j < size; j++) {
          this.splits[i][j] = []
      }  
    }

  }

  lot_length(lot) {
    let length = 0;
    lot.forEach((edge) => {
      const edge_length = distance_between(edge.geometry.start.x,
                                           edge.geometry.start.y,
                                           edge.geometry.end.x,
                                           edge.geometry.end.y);
      length = length + edge_length;
    })
    return length;
  }

  get_square(x, y) {
    const x_offset = x * this.width;
    const y_offset = y * this.width;
    const size = this.width;

    return({top:    {start: {x: x_offset, y: y_offset},   
                     end:   {x: x_offset + size, y: y_offset}},
            bottom: {start: {x: x_offset, y: y_offset + size}, 
                     end:   {x: x_offset + size, y: y_offset + size}},
            left:   {start: {x: x_offset, y: y_offset},   
                     end:   {x: x_offset, y: y_offset + size}},
            right:  {start: {x: x_offset + size, y: y_offset},   
                     end:   {x: x_offset + size, y: y_offset + size}}});
  }
}
