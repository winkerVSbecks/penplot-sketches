const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const pack = require('pack-spheres');
const triangulate = require('delaunay-triangulate');

const defaultSeed = 'tessellated';

// Set a random seed so we can reproduce this print later
Random.setSeed(defaultSeed || Random.getRandomSeed());
console.log('Random Seed:', Random.getSeed());

const settings = {
  suffix: Random.getSeed(),
  dimensions: 'A4',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = props => {
  const { width, height, units } = props;

  const packAttempts = 3000;
  const maxCount = packAttempts * 2;
  const minRadius = 0.00125 / 2;
  const maxRadius = 0.5;

  const circles = pack({
    dimensions: 2,
    packAttempts,
    maxCount,
    minRadius,
    maxRadius,
    padding: 0,
  });

  const otherPoints = new Array(2000)
    .fill(0)
    .map(() => [Random.range(0, width), Random.range(0, height)]);

  const points = circles
    .map(circle => [
      mapRange(circle.position[0], -1, 1, -width * 0.2, width + width * 0.2),
      mapRange(circle.position[1], -1, 1, -height * 0.2, height + height * 0.2),
    ])
    .concat(otherPoints);

  const cells = triangulate(points);

  const paths = cells.map(cell => {
    const p = createPath();

    p.moveTo(points[cell[0]][0], points[cell[0]][1]);

    for (var j = 1; j < cell.length; ++j) {
      p.lineTo(points[cell[j]][0], points[cell[j]][1]);
    }

    p.lineTo(points[cell[0]][0], points[cell[0]][1]);

    return p;
  });

  let lines = pathsToPolylines(paths, { units });

  const margin = width * 0.02;
  const box = [margin, margin, width - margin, height - margin];
  lines = clipPolylinesToBox(lines, box);

  return props =>
    renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.03,
      optimize: true,
    });
};

canvasSketch(sketch, settings);
