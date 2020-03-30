const Bezier = require('bezier-js');

module.exports = class CityBuilder {
  constructor(seed, num_curves) {
    this.seed = seed
    this.magic = this.seed / 2
    this.num_curves = num_curves
    this.next_street = -1;

    this.bezier_sequence = this.lcg_sequence(
      this.magic, 
      this.magic,
      0,
      this.magic).slice(0, num_curves).sort((a, b) => a - b);

    this.bezier_streets = []
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
}