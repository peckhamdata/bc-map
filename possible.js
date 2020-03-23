const bresenham = require("bresenham");
const hp = require("harry-plotter");
const Bezier = require('bezier-js');

var img_size = 1024
var num_v = img_size / 2
var num_c = 64
var curve_num_points = 1024

lcg_sequence = function(seed, max, min, length) {
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

var nums = lcg_sequence(num_v, num_v, 0, num_v).slice(0, num_c).sort((a, b) => a - b);
var line_nums = lcg_sequence(num_v, curve_num_points / 2, 0, curve_num_points).slice(0, num_v).sort((a, b) => a - b);
var offset_nums = lcg_sequence(num_v, curve_num_points / 2, 10, curve_num_points);

var reds = lcg_sequence(num_v, 0, 255, num_v * 10)
var greens = lcg_sequence(num_c, 0, 255, num_v * 10)
var blues = lcg_sequence(curve_num_points, 0, 255, num_v * 10)

var plotter = new hp.JimpPlotter('./demo.png', num_v * 2, num_v * 2);
var prev_curve_points 
var sid = 0

function street_id() {
  sid++
  return sid
}

plotter.init(function() {

  var circle_points = circle(img_size / 2)
  console.log(circle_points.length)
  var inner_circle = circle((img_size / 2) - 128)
  var circle_offset = Math.floor(circle_points.length / 8)
  var inner_circle_length = inner_circle.length
  circle_points.push(...circle_points)
  circle_points.push(...circle_points)
  circle_points.push(...circle_points)
  inner_circle.push(...inner_circle)
  inner_circle.push(...inner_circle)
  inner_circle.push(...inner_circle)
  var curves = []

  var i = 0
  var j = 0
  var colour = {red: 0, green: 100, blue: 0} 
  var streets = []
  for (i=0; i < num_c; i+=1) {
    var here = Math.floor(nums[i]) +50
    var there = here + Math.floor(inner_circle_length / 2)
    var curve = new Bezier(circle_points[here].x,
                           circle_points[here].y, 
                           inner_circle[there].x, inner_circle[there].y,
                           circle_points[here+circle_offset].x,
                           circle_points[here+circle_offset].y);

    // var curve = new Bezier(nums[i], 0, 
    //                        num_v+100, num_v * 3.8,
    //                        num_v+100+nums[i], 0);
    streets.push({id: street_id(),
                  type: 'bezier',
                  geometry: curve,
                  junctions: []})
    var curve_points = curve.getLUT(curve_num_points * 2).map(function(point) {
      return Math.floor(point.x) * 1000 + Math.floor(point.y)
    })
    curves.push(curve_points)
  }
  var all_points = []
  // For each curve except the first one
  for (i=1; i < num_c; i++) {
    // Go through each of the other curves except this one
    for (j=0; j < num_c; j++) {
      if (i !== j) {
        var match = curves[j].filter(function (e) {
          return curves[i].includes(e);
        });
        var junction_points = match.map(function(num) {
          return {x: Math.floor(num/1000), y:num % 1000}
        })
        // console.log(i, j, junction_points.length)
        all_points.push(junction_points)
      }
    }
  }

  var explored = []
  var filename_id = 0
  var cols = []

  lines_of_doom()
  across()
  render_all(streets)

  all_points.forEach(function(point, x) {
      colour = {red: 255, green: greens[x], blue: 255}
      plotter.plot_points(point, colour)
    })

  plotter.write();


  function write() {
    var filename = ('0000'+ filename_id).slice(-4);
    plotter.img_path = filename + '.png'
    plotter.write();
    filename_id++
  }

  function circle(radius) {
    var pointAngleInRadians = 0;
    var points = [];
    for (pointAngleInRadians = 0; 
         pointAngleInRadians <= 7; 
         pointAngleInRadians+=(Math.PI/360)) {
      var x = Math.cos(pointAngleInRadians) * radius;
      var y = Math.sin(pointAngleInRadians) * radius;
      points.push({x: x + (img_size / 2), y: y + (img_size / 2)})
    }
    return points
}

  function lines_of_doom() {
    for (i=1; i < num_c; i++) {
      var lines = []
      for (j=0; j < curve_num_points - 100; j+=50) {
        var k=j // Math.floor(line_nums[j]);
        var offset=100; // Math.floor(offset_nums[j]);
        var curve_points = streets[i].geometry.getLUT(curve_num_points)
        var prev_curve_points = streets[i-1].geometry.getLUT(curve_num_points)
        // ***********************************************************
        //
        // If a street this one connects to has a junction at the same
        // address then add it to this street too.
        var street = {id: street_id(),
                      type: 'bresenham',
                      junctions: [{id: streets[i].id, address: 0},
                                  {id: streets[i-1].id, address: -1}],
                      geometry: {start: {x: curve_points[k].x,
                                         y: curve_points[k].y},
                                 end:   {x: prev_curve_points[k+offset].x,
                                         y: prev_curve_points[k+offset].y}}}
        // Join to existing curve streets
        streets[i].junctions.push({id: street.id, address: k})
        streets[i-1].junctions.push({id: street.id, address: k+offset})
        streets.push(street)
        var line = bresenham(street.geometry.start.x, 
                             street.geometry.start.y,
                             street.geometry.end.x, 
                             street.geometry.end.y)
        // Look for junctions with existing curves

        var line_points = line.map(function(point) {
          return Math.floor(point.x) * 1000 + Math.floor(point.y)
        })

        // Go through each of the curves
        var cj
        for (cj=0; cj < num_c; cj++) {
          var match = curves[cj].filter(function (e) {
            return line_points.includes(e);
          });
          match.forEach(function(point) {
            street.junctions.push({id: cj, address:line_points.indexOf(point)})
            streets[cj].junctions.push({id: street.id, address:curves[cj].indexOf(point)})
          })
        }


        lines.push(street)
      }
      cols.push(lines)
    }
  }

  function across() {

    var c = 0
    var counter = 0;
    var colour_index = 0;
    for (c=1; c < cols.length; c++) {
      var col = cols[c];
      var col_p = cols[c-1];
      var l = 0;
      for (l=0; l < col.length; l++) {
        // var colour = {red: reds[colour_index], 
        //               green: greens[colour_index],
        //               blue: blues[colour_index]} 
       var street = {id: street_id(),
                    type: 'bresenham',
                    junctions: [{id: col_p[l].id, address: 0}, 
                                {id: col[l].id, address: -1}], 
                    geometry: {start: {x: col_p[l].geometry.start.x,
                                       y: col_p[l].geometry.start.y},
                               end:   {x: col[l].geometry.start.x,
                                       y: col[l].geometry.start.y}}}
       col_p[l].junctions.push({id: street.id, address: 0})
       col[l].junctions.push({id: street.id, address: 0})
       streets.push(street)
      }
      var final = col_p[l-1].length
       var final_street = {id: street_id(),
                    type: 'bresenham',
                    junctions: [{id: col_p[l-1].id, address: 0}, 
                                {id: col[l-1].id, address: -1}], 
                    geometry: {start: {x: col_p[l-1].geometry.end.x,
                                       y: col_p[l-1].geometry.end.y},
                               end:   {x: col[l-1].geometry.end.x,
                                       y: col[l-1].geometry.end.y}}}
       col_p[l-1].junctions.push({id: final_street.id, address: -1})
       col[l-1].junctions.push({id: final_street.id, address: -1})
       streets.push(final_street)

    }
  } 

function explore(streets, street_id) {
  if (explored.includes(street_id)) {
    return
  }
  var match = streets.find(function(s) {
    if (s.id == street_id) {
      return true
    } else {
      return false
    }
  })
    if (typeof match !== 'undefined') {
      render(match)
      explored.push(match.id)
      match.junctions.forEach(junction => explore(streets, junction.id))
    }
}

function render(street) {
    var points
    if (street.type === 'bezier') {
      points = street.geometry.getLUT(curve_num_points * 2)
    } else {
      points = bresenham(street.geometry.start.x,
                         street.geometry.start.y,
                         street.geometry.end.x,
                         street.geometry.end.y)
    }
    var colour_index = street.id
    var colour = {red: 0, 
                  green: greens[colour_index],
                  blue: 0} 

    plotter.plot_points(points, colour);
}

function render_junctions(street) {
    // Render junctions
    var points
    if (street.type === 'bezier') {
      points = street.geometry.getLUT(curve_num_points * 2)
    } else {
      points = bresenham(street.geometry.start.x,
                         street.geometry.start.y,
                         street.geometry.end.x,
                         street.geometry.end.y)
    }

    street.junctions.forEach(function(junction, x) {
      var address = junction.address
      if (address == -1) {
        address = points.length-1
      }
      var colour = {red: 0, green: 80, blue: 80}  
      var point = points[address]
      if (typeof point !== 'undefined') {
        plotter.plot_points([point], colour);
      } else {
        console.log(street.id, street.type, address, points.length)
      }
    })

}

function render_all(streets) {
  streets.forEach(street => render(street))
  streets.forEach(street => render_junctions(street))
}

})

