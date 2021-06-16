const fs = require('fs');

const city_size = 1024 * 17;
const num_zones = 16;
const zone_size = Math.floor(city_size / num_zones);

var zones = new Array(num_zones);

for (var i = 0; i < zones.length; i++) {
  zones[i] = new Array(num_zones);
}


let rawdata = fs.readFileSync('city.json');
let unsorted = JSON.parse(rawdata);

unsorted.forEach((row) => {
  row.forEach((element) => {
    // Put in row based on start x
    const zone_x = Math.floor(element.geometry.start.x / zone_size) + 1
    const zone_y = Math.floor(element.geometry.start.y / zone_size) + 1
    console.log(zone_x, zone_y)
    if (zones[zone_x][zone_y] === undefined) {
      zones[zone_x][zone_y] = {'streets': [element]};
    } else {
      zones[zone_x][zone_y].streets.push(element);
    }
  })
})

zones.forEach((row) => {
  let row_text = ":";
  let marker;
  for (var i=0; i < row.length; i++) {
    if (row[i] === undefined) {
      marker = '-';
    } else {
      marker = '*';
    }
    row_text = row_text.concat(marker);

}
  console.log(row.length, row_text);
})

const zone_data = JSON.stringify(zones);

fs.writeFile('zones.json', zone_data, function (err) {
  if (err) throw err;
  console.log('Saved!');
});
