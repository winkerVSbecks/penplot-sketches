const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
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
  const { width, height } = props;

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

  for (let idx = 0; idx < 64 * 4; idx++) {
    boxes.push(getCuboid());
  }

  let paths = [];

  boxes = boxes
    .sort((a, b) => a.location[0] - b.location[0])
    .sort((a, b) => a.location[2] - b.location[2])
    // .sort((a, b) => a.location[1] - b.location[1])
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

const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

function getCuboid() {
  const bounds = [
    [-1, 1],
    [-1, 1],
    [-1, 1],
  ];
  const [[x1, x2], [y1, y2], [z1, z2]] = bounds;

  let size, location;
  const isCube = Random.chance();

  size = [round(Random.range(0.01, 0.1)), round(Random.range(0.1, 0.3))];

  if (isCube) {
    const s = round(Random.range(0.01, 0.1));
    size = [s, s];
  }

  location = [
    round(Random.range(x1, x2)),
    round(Random.range(y1, y2)),
    round(Random.range(z1, z2)),
  ];

  return { size, location };
}
