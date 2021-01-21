const canvasSketch = require('canvas-sketch');
const { renderPaths, pathsToPolylines } = require('canvas-sketch-util/penplot');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const { Delaunay } = require('d3-delaunay');

const settings = {
  // dimensions: [29.7, 21],
  // prefix: '29.7x21-',
  dimensions: [21.59, 13.97],
  prefix: '8.5x5.5-',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = (props) => {
  const { width, height, units } = props;

  const origin = [width / 2, height / 2];
  const side = width * 0.5;

  // const points = randomPoints({
  //   x: [origin[0] - side / 2, origin[0] + side / 2],
  //   y: [origin[1] - side / 2, origin[1] + side / 2],
  //   pointsCount: 20,
  // });

  const x = [origin[0] - side / 2, origin[0] + side / 2];
  const y = [origin[1] - side / 2, origin[1] + side / 2];

  const triangleBase = [
    side * Random.range(0.3, 0.6),
    side * Random.range(0.3, 0.6),
  ];
  const triangle = [
    [x[0], y[0]],
    [x[0] + triangleBase[1], y[0]],
    [x[0], y[0] + triangleBase[0]],
  ];

  const points = randomPointsInTriangle({
    triangle,
    pointsCount: 20,
  });

  const paths = [];

  paths.push([
    triangle[1],
    [x[1], y[0]],
    [x[1], y[1]],
    [x[0], y[1]],
    triangle[2],
    triangle[1],
  ]);

  var delaunay = Delaunay.from(points);

  for (const triangle of delaunay.trianglePolygons()) {
    const t = moveTriangle({ triangle, origin, side });
    paths.push(t);
  }

  // paths.push(delaunay.render());
  // paths.push(delaunay.renderHull());

  let lines = pathsToPolylines(paths, { units });

  return (props) =>
    renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.08,
      optimize: true,
    });
};

canvasSketch(sketch, settings);

function randomPoints({ x, y, pointsCount = 20 }) {
  const points = [];
  const range = [(x[1] - x[0]) * 0.25, (y[1] - y[0]) * 0.25];

  for (let idx = 0; idx < pointsCount; idx++) {
    const randomPoint = [
      Random.range(x[0], x[0] + range[0]),
      Random.range(y[0], y[0] + range[1]),
    ];
    points.push(randomPoint);

    if (pointsCount > pointsCount - 2) {
      points.push([x[0], y[0]]);
      points.push([x[1], y[0]]);
      points.push([x[1], y[1]]);
      points.push([x[0], y[1]]);

      // points.push([x[0] + range[0], y[0]]);
      // points.push([x[1], y[0]]);
      // points.push([x[1], y[1]]);
      // points.push([x[0], y[1]]);
      // points.push([x[0], y[0] + range[1]]);
    }
  }
  return points;
}

function randomPointsInTriangle({ triangle, pointsCount = 20 }) {
  let pts = [];

  pts.push(triangle[0]);
  pts.push(triangle[1]);
  pts.push(triangle[2]);

  for (let idx = 0; idx < pointsCount; idx++) {
    pts.push(randomPointInTriangle(triangle));
  }
  return pts;
}

function randomPointInTriangle([[x1, y1], [x2, y2], [x3, y3]]) {
  const r1 = Random.value();
  const r2 = Random.value();

  return [
    (1 - Math.sqrt(r1)) * x1 +
      Math.sqrt(r1) * (1 - r2) * x2 +
      Math.sqrt(r1) * r2 * x3,
    (1 - Math.sqrt(r1)) * y1 +
      Math.sqrt(r1) * (1 - r2) * y2 +
      Math.sqrt(r1) * r2 * y3,
  ];
}

function moveTriangle({ triangle, origin: [ox, oy], side }) {
  const [cx, cy] = centroid(triangle);
  const direction =
    Math.atan2(cy - oy, cx - ox) + Random.range(-Math.PI / 12, Math.PI / 12);
  const displacement = mapRange(
    area(triangle),
    0,
    side * 0.06 * side * 0.06,
    side * 0.25,
    0,
    true
  );
  const multiplier = Random.range(1, 2);

  // const displacement = mapRange(
  //   Math.hypot(cy - oy, cx - ox),
  //   0,
  //   side / 2,
  //   0,
  //   side * 0.125,
  //   true
  // );

  // const multiplier = mapRange(
  //   area(triangle),
  //   0,
  //   side * 0.05 * side * 0.05,
  //   3,
  //   0,
  //   true
  // );

  return triangle.map((pt) => [
    pt[0] + displacement * multiplier * Math.cos(direction),
    pt[1] + displacement * multiplier * Math.sin(direction),
  ]);
}

function centroid([[x1, y1], [x2, y2], [x3, y3]]) {
  return [(x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3];
}

function area([[x1, y1], [x2, y2], [x3, y3]]) {
  return Math.abs(0.5 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)));
}
