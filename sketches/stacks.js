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
    { x: Math.atan(1 / 2 ** 0.5), y: 1.25 * Math.PI, z: 0 },
    width,
    [width / 2, height / 2],
  );

  const margin = 0.05 * width;

  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  let boxes = [];
  let paths = [];
  const stacks = makeStacks();

  // boxes.push({ size: [0.2, 0.2, 0.2], location: [0, 0.3, 0] });
  // boxes.push({ size: [0.1, 0.1, 0.1], location: [0.05, 0.2, 0.05] });
  // boxes.push({ size: [0.2, 0.2, 0.2], location: [0, 0, 0] });

  // for (let box of boxes) {
  //   const cuboid = renderer.cuboidGeometry(box);
  //   paths.push(...cuboid);
  // }

  for (let stack of stacks) {
    boxes.push(stack);
  }

  boxes = boxes
    // .sort((a, b) => a.location[2] - b.location[2])
    // .sort((a, b) => a.location[1] - b.location[1])
    // .sort((a, b) => a.location[0] - b.location[0])
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

function* makeStacks() {
  const unit = 0.01;
  let x = -100;
  let y = -50;
  let z = -60;
  let size;
  const gap = 3;

  while (z < 80) {
    x = -30;
    let zSpan = 0;

    size = [
      Random.rangeFloor(1, 25),
      Random.rangeFloor(10, 25),
      Random.rangeFloor(1, 25),
    ];

    while (x < 60) {
      y = -50;

      while (y < 50) {
        const location = [x, y, z];

        const stackSize = [
          Random.rangeFloor(5, size[0]),
          size[1],
          Random.rangeFloor(5, size[2]),
        ];

        yield {
          size: [
            stackSize[0] + (size[0] - stackSize[0]) / 2,
            stackSize[1] + (size[1] - stackSize[1]) / 2,
            stackSize[2] + (size[2] - stackSize[2]) / 2,
          ].map((v) => +(v * unit).toPrecision(2)),
          location: location.map((v) => +(v * unit).toPrecision(2)),
        };

        zSpan = size[2] + gap > zSpan ? size[2] + gap : zSpan;
        y = y + size[1] + gap;
        size[1] = Random.rangeFloor(Math.abs(y), 15);
      }
      x = x + size[0] + gap;
      size[0] = Random.rangeFloor(10, size[0]);
    }
    z = z + zSpan;
    size[2] = Random.rangeFloor(10, size[2]);
  }
}
