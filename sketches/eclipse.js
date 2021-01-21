const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const pack = require('pack-spheres');
const collide = require('triangle-circle-collision');

const settings = {
  dimensions: [21.59, 13.97],
  prefix: '8.5x5.5-',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const STYLE = 'TRIANGLE'; //'CIRCLE'

const sketch = (props) => {
  const { width, height, units } = props;

  const scalePoint = (pt) => [
    mapRange(pt[0], -1, 1, 0, height) - (height - width) * 0.5,
    mapRange(pt[1], -1, 1, 0, height),
  ];

  const paths = [];

  const triangle = [0, 1, 2].map((idx) => [
    0.5 * Math.cos((Math.PI * 2 * idx) / 3 + Math.PI / 6),
    0.5 * Math.sin((Math.PI * 2 * idx) / 3 + Math.PI / 6),
  ]);

  const centreCircle = 0.5;

  const circles = pack({
    dimensions: 2,
    packAttempts: 500,
    maxCount: 1000,
    minRadius: () => Random.range(0.01, 0.0625),
    maxRadius: 0.125,
    padding: 0, //0.0025,
    outside: (position, radius) => {
      const maxBound = Math.abs(1);
      for (let i = 0; i < position.length; i++) {
        const component = position[i];
        if (
          Math.abs(component + radius) >= maxBound ||
          Math.abs(component - radius) >= maxBound
        ) {
          return true;
        }
      }

      return STYLE === 'CIRCLE'
        ? Math.hypot(...position) - radius < centreCircle
        : collide(triangle, position, radius);

      return false;
    },
  });

  // Draw circles
  circles.forEach(({ position, radius }) => {
    const [x, y] = scalePoint(position);
    const r = (radius * height) / 2;

    const p = createPath();
    p.arc(x, y, r, 0, Math.PI * 2);
    paths.push(p);
  });

  // Draw triangle
  if (STYLE === 'CIRCLE') {
    // Draw centre circle
    const circlePath = createPath();
    circlePath.arc(
      width / 2,
      height / 2,
      (centreCircle * height) / 2,
      0,
      Math.PI * 2
    );
    paths.push(circlePath);
  } else {
    const trianglePath = createPath();
    trianglePath.moveTo(...scalePoint(triangle[0]));
    trianglePath.lineTo(...scalePoint(triangle[1]));
    trianglePath.lineTo(...scalePoint(triangle[2]));
    trianglePath.closePath();
    paths.push(trianglePath);
  }

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
