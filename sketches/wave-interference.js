const canvasSketch = require('canvas-sketch');
const { renderPaths, pathsToPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { linspace } = require('canvas-sketch-util/math');

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

  linspace(30).forEach((y) => {
    paths.push(
      ...drawWave({
        y: height * y,
        amplitude: height * 0.7 * (1 - y),
        resolution: 30,
        width,
      })
    );
  });

  let lines = pathsToPolylines(paths, { units });

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

const fns = [
  (a, x) =>
    a * Math.abs(Math.tan(Math.PI * Math.cos(Math.PI * Math.sin(Math.PI * x)))),
  (a, x) => a * Math.abs(Math.sin(Math.PI * 1 * Math.tanh(Math.PI * x))),
  (a, x) => a * Math.abs(Math.sin(Math.PI * 1 * Math.tan(Math.PI * x))),
  (a, x) =>
    a *
    (Math.abs(Math.sin(Math.PI * 1 * Math.tan(Math.PI * x))) +
      Math.abs(Math.cos(Math.PI * 2 * x))),
  (a, x) => a * (Math.abs(Math.tanh(Math.PI * 3 * x)) + Math.exp(Math.PI * x)),
  (a, x) => (a * (Math.exp(Math.PI * x) + Math.exp(-Math.PI * x))) / 2,
  (a, x) =>
    a *
    (Math.abs(Math.tanh(Math.PI * 3 * x)) +
      Math.abs(Math.cos(Math.PI * 1 * x))),
  (a, x) => a * Math.abs(Math.tanh(Math.PI * 3 * x)),
  (a, x) =>
    a *
    (Math.abs(Math.tan(Math.PI * 3 * x)) +
      Math.abs(Math.cosh(Math.PI * 1 * x))),
  (a, x) =>
    a *
    (Math.abs(Math.sin(Math.PI * 3 * x)) + Math.abs(Math.cos(Math.PI * 1 * x))),
  (a, x) =>
    a * (Math.abs(Math.sin(Math.PI * 2 * x)) + Math.abs(Math.tan(Math.PI * x))),
  (a, x) => a * Math.abs(Math.sin(Math.PI * 2 * x) + Math.tan(Math.PI * x)),
];

function wave(a, x, index) {
  return fns[index](a, x);
}

function drawWave({ resolution, y, amplitude, width }) {
  const dash = 1 / (4 * resolution); // 0.025;

  return linspace(resolution, true).map((x) => [
    [width * (x - dash), y - wave(amplitude, x, 11)],
    [width * (x + dash), y - wave(amplitude, x, 11)],
  ]);
}
