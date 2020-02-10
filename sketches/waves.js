const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const streamlines = require('@anvaka/streamlines');

const settings = {
  dimensions: [29.7, 21],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '21x29.7-',
};

const sketch = async props => {
  const { width, height } = props;

  const seed = 100; // 0 1000
  Random.setSeed(seed);

  const lines = [];

  await streamlines({
    vectorField(p) {
      const scale = 0.0005; // 0.001 - 0.1 - 0.05
      const noiseVal = Random.noise2D(p.x * scale, p.y * scale);
      const angle = mapRange(noiseVal, 0, 1, 0, 2 * Math.PI);

      return {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
    },
    boundingBox: { left: 0, top: 0, width, height },
    seed: { x: Random.range(0, width), y: Random.range(0, height) },
    dSep: 0.5, // 0.01 * width,
    dTest: 0.1, //0.25, //0.001 * width,
    timeStep: 0.015,
    onStreamlineAdded(points) {
      console.log('stream line created. Number of points: ', points.length);
      const line = points.map(({ x, y }) => [x, y]);
      lines.push(line);
    },
  }).run();

  const margin = 0.05 * width;
  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  console.log('Draw!');

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
