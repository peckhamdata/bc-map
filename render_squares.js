const hp = require("harry-plotter");
const bresenham = require("bresenham");

const fs = require('fs');
const scale = 100;
const size = 250;

async function plot_square (square, x, y) {
  const x_offset = x * size; 	
  const y_offset = y * size;		
  var plotter = new hp.JimpPlotter('./square_' + x + '_' + y + '.png', size, size);
  await plotter.init()
    if(typeof(square) !== "undefined") {	
      let red = Math.floor(Math.random() * 255);
      let green = Math.floor(Math.random() * 255);
      let blue = Math.floor(Math.random() * 255);
      let colour = {red: 0, green: 255, blue: 0};
      square.forEach((element) => {
        var points = bresenham(element.geometry.start.x - x_offset,
                               element.geometry.start.y - y_offset,
  	    	               element.geometry.end.x - x_offset,
	    	               element.geometry.end.y - y_offset);
        plotter.plot_points(points, colour);
      });
      console.log(plotter.img_path);	 
    }
    return plotter.jimp.writeAsync(plotter.img_path)
}

(async() => {
  let rawdata = fs.readFileSync('city_squares_' + scale + '.json');
  let squares = JSON.parse(rawdata);
  for (var i=0; i<squares.length; i++) {
    if (squares[i].length > 0) {
      for (var j=0; j<squares[i].length; j++) {
        if (squares[i][j].length > 0) {      
          console.log('plotting:' + i,j + ' of:' + squares.length, squares[i].length)	    
          const result = await plot_square(squares[i][j], i, j)
         } else {
          console.log('skipping ' + i,j + ' of:' + squares.length, squares[i].length)	
	  const result = await plot_square(undefined, i, j);	 
        } 
      }
    }
  }
})();
