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

  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  let boxes = [];

  for (let idx = 0; idx < 64; idx++) {
    boxes.push(getCuboid());
  }

  let paths = [];

  // boxes = [
  //   {
  //     size: [0.1, 0.1],
  //     location: [-0.375, 0, -0.25],
  //     id: 3,
  //   },
  //   {
  //     size: [0.1, 0.1],
  //     location: [-0.25, 0, -0.5],
  //     id: 2,
  //   },
  //   {
  //     size: [0.1, 0.1],
  //     location: [-0.5, 0, -0.5],
  //     id: 1,
  //   },
  //   {
  //     size: [0.1, 0.1],
  //     location: [-0.5, 0.3, -0.5],
  //     id: 0,
  //   },
  // ];

  // boxes = [
  //   { size: [0.07, 0.27], location: [-0.08, 0.2, -0.1] },
  //   { size: [0.1, 0.28], location: [0.16, 0.2, -0.09] },
  //   { size: [0.15, 0.27], location: [0.02, 0.2, -0.06] },
  //   { size: [0.07, 0.29], location: [0.05, 0.2, -0.05] },
  //   { size: [0.07, 0.29], location: [-0.01, 0.2, 0.11] },
  // ];

  boxes = boxes
    .sort((a, b) => a.location[0] - b.location[0])
    .sort((a, b) => a.location[2] - b.location[2])
    .sort((a, b) => b.location[1] - a.location[1])
    .forEach((box) => {
      const cuboid = renderer.cuboidGeometry(box);

      const cuboidClip = polygonClipping.union(...cuboid.map((v) => [v]))[0];

      paths = paths.reduce((acc, p) => {
        const res = polygonClipping.difference([p], cuboidClip).flat(1);
        return p.length > 0 ? acc.concat(res) : acc;
      }, []);

      paths.push(...cuboid);
    });

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

const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

function getCuboid() {
  const bounds = [
    [-0.3, 0.3],
    [-0.5, 0.5],
    [-0.3, 0.3],
  ];
  const [[x1, x2], [y1, y2], [z1, z2]] = bounds;

  let size, location;
  const isCube = Random.chance();

  size = [round(Random.range(0.01, 0.1)), round(Random.range(0.1, 0.25))];

  if (isCube) {
    const s = round(Random.range(0.05, 0.15));
    size = [s, s];
  }

  location = [
    round(Random.range(x1, x2)),
    round(Random.range(y1, y2)),
    round(Random.range(z1, z2)),
  ];

  const bbox = [
    [location[0] - size[0], location[0] + size[0]],
    [location[1] - size[1], location[1] + size[1]],
    [location[2] - size[0], location[2] + size[0]],
  ];

  const cuboid = withinBounds({ size, location }, bounds)
    ? { size, location }
    : getCuboid();

  // const cuboid =
  //   withinBounds({ size, location }, bounds) && noCollisions(bbox, cuboids)
  //     ? { size, location }
  //     : getCuboid();

  cuboids.push(bbox);

  return cuboid;
}
