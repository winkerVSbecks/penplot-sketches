const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const { drawClixo } = require('./draw-clixo');

const settings = {
  dimensions: [21.59, 13.97],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '8.5x5.5-',
};

const config = {
  xCount: 9,
  yCount: 6,
  trim: false,
};

// Check for An+B type patterns
function matchesPattern(a, b, x) {
  return (x - b) % a === 0;
}

const sketch = (props) => {
  const margin = 0.05 * props.width;
  const offset = [margin, margin];

  const width = props.width - margin * 2;
  const height = props.height - margin * 2;

  const res = [2 * config.xCount + 1];
  const size = width / res[0];
  const yCount = Math.floor(height / size);
  res[1] = yCount;
  const r = size / 2;

  const limits = {
    x: [config.trim ? 0 : -2, config.trim ? res[0] - 1 : res[0]],
    y: [config.trim ? 0 : -2, config.trim ? res[1] - 1 : res[1] + 1],
  };

  const grid = [];

  for (let i = limits.x[0]; i < limits.x[1]; i++) {
    for (let j = limits.y[0]; j < limits.y[1]; j++) {
      const x = i * size;
      const y = j * size;

      grid.push({
        x: i,
        y: j,
        cx: x + r,
        cy: y + r,
      });
    }
  }

  const paths = [];

  grid.forEach(({ x, y, cx, cy }) => {
    if (matchesPattern(4, 0, x)) {
      if (y === 0) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['tl']));
      }
      if (y === 4) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['tr']));
      }
      if (y === 8) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['br']));
      }
      if (y === 12) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['bl']));
      }
      if (y === 16) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['t']));
      }
      if (y === 20) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['b']));
      }
      if (y === 24) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['l']));
      }
      if (y === 28) {
        paths.push(drawClixo(cx + offset[0], cy + offset[1], r, ['r']));
      }
    }
  });

  return (props) =>
    renderPaths(
      paths.map((p) => p.toString()),
      {
        ...props,
        lineJoin: 'round',
        lineCap: 'round',
        lineWidth: 0.05,
        optimize: true,
      }
    );
};

canvasSketch(sketch, settings);
