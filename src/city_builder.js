const Bezier = require('bezier-js');
const bresenham = require("bresenham");

module.exports = class CityBuilder {
  constructor(seed, num_curves) {
    this.seed = seed
    this.magic = this.seed / 2
    this.num_curves = num_curves
    this.next_street = -1;
    this.curve_num_points = this.seed

    this.bezier_sequence = this.lcg_sequence(this.magic, 
                                             this.magic,
                                             0,
                                             this.magic).
    slice(0, num_curves).sort((a, b) => a - b);

    this.bezier_streets = []
    this.diagonal_streets = []
    this.cross_streets = []

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
    var pointAngleInRadians = 0;
    var points = [];
    for (pointAngleInRadians = 0; 
         pointAngleInRadians <= 7; 
         pointAngleInRadians+=(Math.PI/360)) {
      var x = Math.cos(pointAngleInRadians) * radius;
      var y = Math.sin(pointAngleInRadians) * radius;
      points.push({x: x + (this.seed / 2), y: y + (this.seed / 2)})
    }
    return points
  }

  street_id() {
    this.next_street++;
    return this.next_street;
  }

  build_bezier_streets() {

    var circle_points = this.circle(this.seed / 2)
    var inner_circle = this.circle((this.seed / 2) - 128) // #MAGIC
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
      var curve = new Bezier(circle_points[here].x,
                             circle_points[here].y, 
                             inner_circle[there].x, inner_circle[there].y,
                             circle_points[here+circle_offset].x,
                             circle_points[here+circle_offset].y);

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
        var curve_points = this.bezier_streets[i].geometry.getLUT(this.curve_num_points)
        var prev_curve_points = this.bezier_streets[i-1].geometry.getLUT(this.curve_num_points)
        var street = {id: this.street_id(),
                      type: 'bresenham',
                      junctions: [{id: this.bezier_streets[i].id, address: 0},
                                  {id: this.bezier_streets[i-1].id, address: -1}],
                      geometry: {start: {x: curve_points[k].x,
                                         y: curve_points[k].y},
                                 end:   {x: prev_curve_points[k+offset].x,
                                         y: prev_curve_points[k+offset].y}}}
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
                    junctions: [{id: col_p[l].id, address: 0}, 
                                {id: col[l].id, address: -1}], 
                    geometry: {start: {x: col_p[l].geometry.start.x,
                                       y: col_p[l].geometry.start.y},
                               end:   {x: col[l].geometry.start.x,
                                       y: col[l].geometry.start.y}}}
       col_p[l].junctions.push({id: street.id, address: 0})
       col[l].junctions.push({id: street.id, address: 0})
       this.cross_streets.push(street)
      }
      var final = col_p[l-1].length
       var final_street = {id: this.street_id(),
                    type: 'bresenham',
                    junctions: [{id: col_p[l-1].id, address: 0}, 
                                {id: col[l-1].id, address: -1}], 
                    geometry: {start: {x: col_p[l-1].geometry.end.x,
                                       y: col_p[l-1].geometry.end.y},
                               end:   {x: col[l-1].geometry.end.x,
                                       y: col[l-1].geometry.end.y}}}
       col_p[l-1].junctions.push({id: final_street.id, address: -1})
       col[l-1].junctions.push({id: final_street.id, address: -1})
       this.cross_streets.push(final_street)

    }
  }   

  add_junctions() {

    function to_int (point) {
      return Math.floor(point.x) * 1000 + Math.floor(point.y)
    }

    var street_points = {}
    this.bezier_streets.forEach(street => {
      var points = street.geometry.getLUT(this.curve_num_points)
      street_points[street.id] = points.map(function(point) {
        return to_int(point)
      });
    })
    this.diagonal_streets.forEach(street => {
      var points = bresenham(street.geometry.start.x,
                             street.geometry.start.y,
                             street.geometry.end.x,
                             street.geometry.end.y)
      street_points[street.id] = points.map(function(point) {
        return to_int(point)
      });
    })
    this.cross_streets.forEach(street => {
      var points = bresenham(street.geometry.start.x,
                             street.geometry.start.y,
                             street.geometry.end.x,
                             street.geometry.end.y)
      street_points[street.id] = points.map(function(point) {
        return to_int(point)
      });
    })

    // Decide where to put this
    for (const [key, value] of Object.entries(street_points)) {

      var street;
      street = this.bezier_streets.filter(obj => {
        return obj.id == parseInt(key, 0)
      })
      if (street.length === 0) {
        street = this.diagonal_streets.filter(obj => {
          return obj.id == parseInt(key, 0)
        })
      }
      if (street.length === 0) {
        street = this.cross_streets.filter(obj => {
          return obj.id == parseInt(key, 0)
        })
      }
      if (street.length !== 0) {
        for (const [key_i, value_i] of Object.entries(street_points)) {
          if (key != key_i) {
            // No point trying to match with self
            var result = value.filter(function (e) {
              return value_i.includes(e);
            });
            result.forEach(function(point) {
              try { 
                street[0].junctions.push({id: key_i, address:value.indexOf(point)})
              }
              catch(err) {
                console.log(err)
                console.log(street)
                console.log(key)
              }
            })

          }
          // for (var cj=0; cj < num_c; cj++) {
          //   var match = curves[cj].filter(function (e) {
          //     return line_points.includes(e);
          //   });


            // match.forEach(function(point) {
            //   street.junctions.push({id: cj, address:line_points.indexOf(point)})
            //   streets[cj].junctions.push({id: street.id, address:curves[cj].indexOf(point)})
            // })
        }
      }
    }
    // for each street go through its points and see if it matches
    // a point in another street
    // if it does make a junction    


  }
}