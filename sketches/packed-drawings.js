/**
 * Inspired Letter collages by Deborah Schmidt
 * http://frauzufall.de/en/2017/google-quick-draw/
 */
const canvasSketch = require('canvas-sketch');
const _ = require('lodash');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { renderPaths } = require('canvas-sketch-util/penplot');
const pack = require('pack-spheres');
const drawingData = require('../quickdraw-dataset/circle_5000.json');

const settings = {
  dimensions: 'letter',
  orientation: 'portrait',
  scaleToView: true,
  prefix: 'letter',
  pixelsPerInch: 300,
  units: 'cm',
};

const sketch = props => {
  const { width, height } = props;

  const bounds = width * 0.25;

  const circles = pack({
    dimensions: 2,
    bounds,
    sample: () => Random.insideCircle(bounds),
    packAttempts: 500,
    maxCount: 500,
    minRadius: 0.06 * bounds,
    maxRadius: 0.4 * bounds,
    padding: 0.005 * bounds,
  }).map(c => {
    const r = c.radius - 2 * c.padding;

    const x = mapRange(
      c.position[0],
      -bounds,
      bounds,
      width * 0.5 - bounds,
      width * 0.5 + bounds,
    );
    const y = mapRange(
      c.position[1],
      -bounds,
      bounds,
      height * 0.5 - bounds,
      height * 0.5 + bounds,
    );

    return [
      [x - r, x + r],
      [y - r, y + r],
    ];
  });

  const scaleTo = ([xMin, xMax], [yMin, yMax]) => stroke => {
    const xs = stroke[0].map(x => mapRange(x, 0, 255, xMin, xMax));
    const ys = stroke[1].map(y => mapRange(y, 0, 255, yMin, yMax));
    return [xs, ys];
  };

  const strokeToLine = stroke => _.zip(stroke[0], stroke[1]);

  const drawings = drawingData.map(d => d.drawing);

  const drawingToScaledLine = (strokes, bounds) =>
    strokes.map(scaleTo(...bounds)).map(strokeToLine);

  const lines = circles.map(bounds =>
    drawingToScaledLine(Random.pick(drawings), bounds),
  );

  return props =>
    renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });
};

canvasSketch(sketch, settings);
