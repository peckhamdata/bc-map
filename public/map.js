function drawSkeleton(ctx, curve, offset = {x: 0, y: 0}, nocoords) {
  var pts = curve.points;
  ctx.strokeStyle = "lightgrey";
  drawLine(ctx, pts[0], pts[1], offset);
  if (pts.length === 3) drawLine(ctx, pts[1], pts[2], offset);
  else drawLine(ctx, pts[2], pts[3], offset);
  ctx.strokeStyle = "black";
  if(!nocoords) drawPoints(ctx, pts, offset);
}

function drawCurve(app, curve, offset, colour_int) {

  let line = new PIXI.Graphics();

  line.lineStyle(1, colour_int, 1);

  offset = offset || { x:0, y:0 };
  var ox = offset.x;
  var oy = offset.y;
  // ctx.beginPath();
  var p = curve.points, i;
  line.moveTo(p[0].x + ox, p[0].y + oy);
  if (p.length === 3) {
    line.quadraticCurveTo(
      p[1].x + ox, p[1].y + oy,
      p[2].x + ox, p[2].y + oy
    );
  }
  if (p.length === 4) {
    line.bezierCurveTo(
      p[1].x + ox, p[1].y + oy,
      p[2].x + ox, p[2].y + oy,
      p[3].x + ox, p[3].y + oy
    );
  }

  line.filters = [
       new PIXI.filters.GlowFilter({ distance: 15, outerStrength: 2, color: 0x93fdff })
   ];
  // ctx.strokeStyle = "red";
  app.addChild(line);

}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function rgbToInt(r, g, b) {
  return parseInt(Number("0x" + componentToHex(r) + componentToHex(g) + componentToHex(b)), 10);
}

// 0xFF00FF


function drawLine(app, p1, p2, offset, colour_int) {

let line = new PIXI.Graphics();
line.lineStyle(1, colour_int, 1);

  offset = offset || { x:0, y:0 };
  var ox = offset.x;
  var oy = offset.y;

  line.moveTo(Math.floor(p1.x + ox), Math.floor(p1.y + oy));
  line.lineTo(Math.floor(p2.x + ox), Math.floor(p2.y + oy));
//   // ctx.strokeStyle = rgbToHex(Math.floor(colour.red), 
//   //                            Math.floor(colour.green), 
//   //                            Math.floor(colour.blue));

  line.filters = [
       new PIXI.filters.GlowFilter({ distance: 15, outerStrength: 2, color: 0xffd6a2 })
   ];


  app.addChild(line);
}

