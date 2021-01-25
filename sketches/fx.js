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

  function f(x) {
    if (x < 0.25) return;

    drawArc(x);

    f((1 * x) / 4);
    f((2 * x) / 4);
    f((3 * x) / 4);
  }

  let x = 0.35;
  function drawArc(_x) {
    if (x > width - 0.3) {
      return;
    }

    const p = createPath();
    const h = (height * 0.5 * _x) / 2;
    const r = 0.1;

    p.moveTo(x, height / 2);
    p.lineTo(x, height / 2 - h);
    p.moveTo(x + r, height / 2 - h - r);
    p.arc(x, height / 2 - h - r, r, 0, Math.PI * 2);

    p.moveTo(x, height / 2);
    p.lineTo(x, height / 2 + h);
    p.moveTo(x + r, height / 2 + h + r);
    p.arc(x, height / 2 + h + r, r, 0, Math.PI * 2);

    paths.push(p);

    x += 0.3;
  }

  for (let index = 0; index < 24; index++) {
    f(1);
  }

  let lines = pathsToPolylines(paths, { units });

  // Clip to bounds, using a margin in working units
  const margin = 0; // in working 'units' based on settings
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
