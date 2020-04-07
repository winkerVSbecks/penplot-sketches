const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const Random = require('canvas-sketch-util/random');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  dimensions: [29.7, 21],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '21x29.7-',
};

const sketch = (props) => {
  const { width, height, units } = props;

  const RESOLUTION = 24;
  const paths = [];

  const s = width / RESOLUTION;

  for (let x = 0; x < width; x += s) {
    for (let y = 0; y < height; y += s) {
      const tile = Random.pick([tileCross, tileArcs, tileArcsAlt]);
      paths.push(tile([x, y], s));
    }
  }

  const margin = 0.04 * width;
  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  const lines = pathsToPolylines(paths, { units });

  return (props) =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.1,
      optimize: true,
    });
};

canvasSketch(sketch, settings);

function tileCross([x, y], s) {
  const p = createPath();

  p.moveTo(x + s / 2, y);
  p.lineTo(x + s / 2, y + s / 4);

  p.moveTo(x + s / 2, y + s / 2 + s / 4);
  p.lineTo(x + s / 2, y + s);

  p.moveTo(x, y + s / 2);
  p.lineTo(x + s, y + s / 2);

  return p;
}

function tileArcs([x, y], s) {
  const p = createPath();

  p.arc(x, y, s / 2, 0, Math.PI / 2);

  p.moveTo(x + s / 2, y + s);
  p.arc(x + s, y + s, s / 2, Math.PI, (3 * Math.PI) / 2);

  return p;
}

function tileArcsAlt([x, y], s) {
  const p = createPath();

  p.arc(x, y + s, s / 2, (3 * Math.PI) / 2, 0);

  p.moveTo(x + s, y + s / 2);
  p.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);

  return p;
}
