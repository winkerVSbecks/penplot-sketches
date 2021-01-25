const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');

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

  const paths = [];

  function f(x, offset) {
    if (x < 0.25) return;

    drawArc(x, offset);

    f((1 * x) / 4, offset);
    f((2 * x) / 4, offset);
    f((3 * x) / 4, offset);
  }

  const o = [width / 2, height / 2];
  function drawArc(x, offset) {
    const p = createPath();
    const r = width * 0.5 * x;
    const angle = Math.random() * Math.PI * 2 + Math.PI * 0.5 * x;
    const size = x * Math.PI * 0.0625;

    p.arc(o[0], o[1], r, angle - size, angle + size);

    paths.push(p);

    x += 0.3;
  }

  for (let index = 0; index < 24; index++) {
    f(1, 0.1 * index);
  }

  let lines = pathsToPolylines(paths, { units });

  // Clip to bounds, using a margin in working units
  const margin = 1; // in working 'units' based on settings
  const box = [margin, margin, width - margin, height - margin];
  lines = clipPolylinesToBox(lines, box);

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
