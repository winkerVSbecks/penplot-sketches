const canvasSketch = require('canvas-sketch');
const { renderPaths, pathsToPolylines } = require('canvas-sketch-util/penplot');
const Random = require('canvas-sketch-util/random');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const polygonClipping = require('polygon-clipping');
const Renderer3D = require('../utils/renderer-3d');

const settings = {
  dimensions: [21.59, 13.97],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '8.5x5.5-',
};

const sketch = (props) => {
  const { width, height, units } = props;

  const renderer = new Renderer3D(
    1,
    { x: Math.atan(1 / 2 ** 0.5), y: Math.PI / 4, z: 0 },
    width,
    [width, height],
  );

  const margin = 0.05 * width;

  let paths = [];

  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  // paths.push(renderer.debug());

  // paths.push(
  //   renderer.face({
  //     direction: 'top',
  //     size: [0.3, 0.3],
  //     location: [0, 0.5, 0],
  //   }),
  // );

  // paths.push([
  //   [0.25 * width, 0.25 * height],
  //   [0.5 * width, 0.25 * height],
  //   [0.5 * width, 0.5 * height],
  //   [0.25 * width, 0.5 * height],
  //   [0.25 * width, 0.25 * height],
  // ]);

  // paths.push([
  //   [0.55 * width, 0.4 * height],
  //   [0.75 * width, 0.4 * height],
  //   [0.75 * width, 0.6 * height],
  //   [0.55 * width, 0.6 * height],
  //   [0.55 * width, 0.4 * height],
  // ]);

  // paths.push([
  //   [0.6 * width, 0.5 * height],
  //   [0.9 * width, 0.5 * height],
  //   [0.9 * width, 0.75 * height],
  //   [0.6 * width, 0.75 * height],
  //   [0.6 * width, 0.5 * height],
  // ]);

  // const clipper = [
  //   [0.4 * width, 0.45 * height],
  //   [0.8 * width, 0.45 * height],
  //   [0.8 * width, 0.65 * height],
  //   [0.4 * width, 0.65 * height],
  //   [0.4 * width, 0.45 * height],
  // ];

  // paths = paths.map(
  //   (p) => polygonClipping.difference([p], [clipper]).flat()[0],
  // );

  // paths.push(clipper);

  for (let idx = 0; idx < 5; idx++) {
    const cuboid = renderer.cuboidGeometry(getCuboid());

    cuboid.forEach((face) => {
      paths = paths.map((p) => {
        const res = polygonClipping.difference([p], [face])[0];
        return res ? res[0] : p;
      });

      paths.push(face);
    });
  }

  const lines = paths;

  return (props) =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });
};

canvasSketch(sketch, settings);

const inRange = (v, [low, high]) => v >= low && v <= high;

function withinBounds({ size: [w, h], location: [x, y, z] }, bounds) {
  return (
    inRange(x - w, bounds[0]) &&
    inRange(x + w, bounds[0]) &&
    inRange(y - h, bounds[1]) &&
    inRange(y + h, bounds[1]) &&
    inRange(z - w, bounds[2]) &&
    inRange(z + w, bounds[2])
  );
}

function intersects(a, b) {
  return (
    a[0][0] <= b[0][0] &&
    a[0][1] >= b[0][1] &&
    a[1][0] <= b[1][0] &&
    a[1][1] >= b[1][1] &&
    a[2][0] <= b[2][0] &&
    a[2][1] >= b[2][1]
  );
}

function noCollisions(bbox, cuboids) {
  return cuboids.reduce((res, c) => {
    return res && !intersects(bbox, c);
  }, true);
}

const cuboids = [];

function getCuboid() {
  const bounds = [
    [-0.3, 0.3],
    [-0.2, 0.5],
    [-0.3, 0.3],
  ];
  const [[x1, x2], [y1, y2], [z1, z2]] = bounds;

  let size, location;
  const isCube = Random.chance();

  // if (!isCube) {
  //   const s = Random.range(0.05, 0.1);
  //   size = [s, s];
  //   location = [
  //     Random.range(x1, x2),
  //     Random.range(y1, y2),
  //     Random.range(z1, z2),
  //   ];
  // } else {
  size = [Random.range(0.05, 0.15), Random.range(0.25, 1)];
  location = [Random.range(x1, x2), Random.range(y1, y2), Random.range(z1, z2)];
  // }

  const bbox = [
    [location[0] - size[0], location[0] + size[0]],
    [location[1] - size[1], location[1] + size[1]],
    [location[2] - size[0], location[2] + size[0]],
  ];

  const cuboid =
    withinBounds({ size, location }, bounds) && noCollisions(bbox, cuboids)
      ? { size, location }
      : getCuboid();

  cuboids.push(bbox);

  return cuboid;
}
