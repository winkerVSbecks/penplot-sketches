const canvasSketch = require('canvas-sketch');
const { renderPaths, pathsToPolylines } = require('canvas-sketch-util/penplot');
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
  xCount: 6,
  yCount: 6,
  trim: true,
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

  let paths = [];
  let layer1 = [];
  let layer2 = [];

  grid.forEach(({ x, y, cx, cy }) => {
    if (matchesPattern(2, 0, x) && matchesPattern(4, 0, y)) {
      const isLastColumn = x === res[0] - 3;
      const trim = isLastColumn ? ['b'] : ['b', 'tr'];

      layer1.push(drawClixo(cx + offset[0], cy + offset[1], r, trim));
    }
  });

  grid.forEach(({ x, y, cx, cy }) => {
    if (matchesPattern(2, 0, x) && matchesPattern(4, 2, y)) {
      const isLastRow = y === res[1] - 2;
      const isLastColumn = x === res[0] - 3;

      let trim;
      if (isLastRow) {
        trim = isLastColumn ? [] : ['tr', 'br'];
      } else if (isLastColumn) {
        trim = ['b'];
      } else {
        trim = ['tr', 'b'];
      }

      layer2.push(drawClixo(cx + offset[0], cy + offset[1], r, trim));
    }
  });

  paths.push(...layer1);
  paths.push(...layer2);

  return (props) => {
    const layer1Paths = renderPaths(layer1, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    })[1];
    const layer2Paths = renderPaths(layer2, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    })[1];

    const allPaths = renderPaths(paths, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    })[0];

    return [allPaths, layer1Paths, layer2Paths];
  };
};

canvasSketch(sketch, settings);
