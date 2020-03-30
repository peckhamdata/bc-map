const Bezier = require('bezier-js');

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
        // Join to existing curve streets
        this.bezier_streets[i].junctions.push({id: street.id, address: k})
        this.bezier_streets[i-1].junctions.push({id: street.id, address: k+offset})
        this.diagonal_streets.push(street)
      }
    }
  }  
}