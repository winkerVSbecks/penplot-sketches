const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { mapRange, linspace, lerp } = require('canvas-sketch-util/math');

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

// Random.setSeed('500');

const sketch = (props) => {
  const { width, height, units } = props;

  const res = [10, 10];
  const tileSize = [width / (res[0] + 2), width / (res[1] + 2)];
  const offset = [
    tileSize[0],
    tileSize[1] /* (height - tileSize[1] * res[1]) / 2 */,
  ];

  let lines = [];

  for (let x = 1; x <= res[0]; x++) {
    for (let y = 1; y <= res[1]; y++) {
      const minX = offset[0] + tileSize[0] * (x - 1);
      const maxX = offset[0] + tileSize[0] * x;

      const minY = offset[1] + tileSize[1] * (y - 1);
      const maxY = offset[1] + tileSize[1] * y;

      const a = mapRange(
        Random.noise2D(x / (res[0] * 1.5), y / (res[1] * 1.5)),
        0,
        1,
        -Math.PI / 4,
        Math.PI / 4
      );

      const cy = (minY + maxY) / 2;
      const r = tileSize[1];

      const tileLines = linspace(5).map((_t) => {
        const t = mapRange(_t, 0, 1, 0.1, 0.9);

        const cx = lerp(minX, maxX, 0.5);
        const [px, py] = rotateAbout([cx, cy], a, [
          lerp(minX, maxX, t) + Random.range(-0.05, 0.05),
          cy,
        ]);

        return [
          [
            px + r * Math.cos(a + Math.PI / 2),
            py + r * Math.sin(a + Math.PI / 2),
          ],
          [
            px + r * Math.cos(a - Math.PI / 2),
            py + r * Math.sin(a - Math.PI / 2),
          ],
        ];
      });

      lines.push(...clipPolylinesToBox(tileLines, [minX, minY, maxX, maxY]));
    }
  }

  // const box = [
  //   tileSize[0],
  //   tileSize[1],
  //   width - tileSize[0],
  //   height - tileSize[1],
  // ];
  // lines = clipPolylinesToBox(lines, box);

  console.log(lines.length);

  return (props) =>
    renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'butt',
      lineWidth: 0.05,
      optimize: true,
    });
};

canvasSketch(sketch, settings);

function angle([x, y], [cx, cy], radius) {
  const d = Math.hypot(x - cx, y - cy);

  return mapRange(d, 0, radius, -0.25, 0.5);
}

function rotateAbout([cx, cy], angle, [x, y]) {
  // translate point back to origin:
  x -= cx;
  y -= cy;

  // rotate point
  var xNew = x * Math.cos(angle) - y * Math.cos(angle);
  var yNew = x * Math.sin(angle) + y * Math.sin(angle);

  // translate point back:
  x = xNew + cx;
  y = yNew + cy;

  return [x, y];
}
