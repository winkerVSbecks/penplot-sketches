const canvasSketch = require('canvas-sketch');
const { renderPaths, createPath } = require('canvas-sketch-util/penplot');
const { lerp } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  dimensions: 'a3',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: 'a3',
};

const sketch = props => {
  const { width, height } = props;

  const GR = 1.618033988749895;
  const gridSize = 60;
  const canvasSize = width * 0.6;
  const size = (canvasSize / gridSize) * 0.5;
  const p = [(width - canvasSize) / 2, (height - canvasSize) / 2];

  // const convergence = [width / (1 + 1 / GR), height / (1 + 1 / GR)];
  const convergence = [width / 2, height / 2];

  function vecField(x, y) {
    // return [y - x, -x - y];
    const l = Math.hypot(x, y) ** 0.5;
    const f = Math.sin(2 * x + 2 * y);
    const r = (x ** 2 + y ** 2) / (2 * x);

    return [y, x ** 2 + y ** 2 * x - 3 * y];
    return [x - y - x * (x ** 2 + y ** 2), x + y - y * (x ** 2 + y ** 2)];
    return [x + 2 * y, 3 * x];
    return [Math.cos(x) * y, Math.sin(x) * y];
    return [x, (y ** 2 - x ** 2) / (2 * x * y)];
    return [Math.cos(f), Math.sin(f)];
    return [Math.sin(y), Math.sin(x)];
    return [-y, x];
    return [Math.exp(y), y];
    return [x, l];
    return [x / x, y + Math.sin(y)];
    return [y, Math.cos(Math.log(l * Math.min(Math.cos(l))))];
    return [Math.tan(y - x), Math.tan(-x - y)];
  }

  const lines = [];

  for (let y = 0; y < gridSize; y++) {
    const line = [];
    for (let x = 0; x < gridSize; x++) {
      const u = x / (gridSize - 1);
      const v = y / (gridSize - 1);

      const tx = lerp(0, width, u);
      const ty = lerp(0, height, v);

      const h = vecField(tx - convergence[0], ty - convergence[1]);
      const heading = Math.atan2(h[1], h[0]);

      // lines.push([
      //   [tx, ty],
      //   [tx + size * Math.cos(heading), ty + size * Math.sin(heading)],
      // ]);

      lines.push([
        [tx - size * Math.cos(heading), ty - size * Math.sin(heading)],
        [tx + size * Math.cos(heading), ty + size * Math.sin(heading)],
      ]);

      // line.push([tx - size, ty + size * Math.sin(heading)]);
    }
    // lines.push(line);
  }

  const clipBox = [
    [p[0], p[1]],
    [width - p[0], height - p[1]],
  ];

  return props =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.1,
      optimize: true,
    });
};

canvasSketch(sketch, settings);
