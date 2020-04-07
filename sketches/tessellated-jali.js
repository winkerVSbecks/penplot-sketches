const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { mapRange, lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const pack = require('pack-spheres');
const triangulate = require('delaunay-triangulate');

// const defaultSeed = '721866';

// Set a random seed so we can reproduce this print later
Random.setSeed(Random.getRandomSeed());
console.log('Random Seed:', Random.getSeed());

const settings = {
  dimensions: [29.7, 21],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '21x29.7-',
};

const sketch = props => {
  const { width, height, units } = props;

  const gridSize = [24, 48];
  const B = [
    [5, 19],
    [12, 36],
  ];
  const grid = [];

  const gridLines = [];

  for (let x = 0; x < gridSize[0]; x++) {
    for (let y = 0; y < gridSize[1]; y++) {
      // get a 0..1 UV coordinate
      const u = x / (gridSize[0] - 1);
      const v = y / (gridSize[1] - 1);

      const idx = x + gridSize[0] * y;
      grid[idx] = [u, v];
    }
  }

  function inTessellationZone(x, y) {
    return y >= B[1][0] && y < B[1][1] && x > B[0][0] && x < B[0][1];
  }

  const gridPoints = [];

  for (let x = 1; x < gridSize[0] - 1; x++) {
    const p = createPath();
    for (let y = 1; y < gridSize[1] - 1; y++) {
      // get a 0..1 UV coordinate
      const u = x / (gridSize[0] - 1);
      const v = y / (gridSize[1] - 1);

      // scale to dimensions
      const tx = lerp(0, width, u);
      const ty = lerp(0, height, v);

      if (
        (y === B[1][0] - 1 || y === B[1][1] - 1) &&
        x >= B[0][0] &&
        x < B[0][1]
      ) {
        gridPoints.push([tx, ty]);
      }

      if (y === 0) {
        p.moveTo(tx, ty);
      } else if (inTessellationZone(x, y)) {
        p.moveTo(tx, ty);
      } else {
        p.lineTo(tx, ty);
      }
    }
    gridLines.push(p);
  }

  for (let y = 1; y < gridSize[1] - 1; y++) {
    const p = createPath();
    for (let x = 1; x < gridSize[0] - 1; x++) {
      // get a 0..1 UV coordinate
      const u = x / (gridSize[0] - 1);
      const v = y / (gridSize[1] - 1);

      // scale to dimensions
      const tx = lerp(0, width, u);
      const ty = lerp(0, height, v);

      // if ((x === B[0][0] || x === B[0][1]) && y >= B[1][0] && y < B[1][1]) {
      //   gridPoints.push([tx, ty]);
      // }

      if (x === 0) {
        p.moveTo(tx, ty);
      } else if (inTessellationZone(x, y)) {
        p.moveTo(tx, ty);
      } else {
        p.lineTo(tx, ty);
      }
    }
    gridLines.push(p);
  }

  const circles = pack({
    dimensions: 2,
    sample: () => {
      const x = Random.rangeFloor(B[0][0], B[0][1]);
      const y = Random.rangeFloor(B[1][0], B[1][1]);
      const idx = x + gridSize[0] * y;
      return grid[idx];
    },
    packAttempts: 500,
    maxCount: 50,
    minRadius: 0.01,
    maxRadius: 0.25,
    padding: 0,
  });

  const points = circles
    .map(circle => [
      mapRange(circle.position[0], 0, 1, 0, width),
      mapRange(circle.position[1], 0, 1, 0, height),
    ])
    .concat(gridPoints);

  const cells = triangulate(points);

  const paths = cells
    .map(cell => {
      const p = createPath();

      p.moveTo(points[cell[0]][0], points[cell[0]][1]);

      for (var j = 1; j < cell.length; ++j) {
        p.lineTo(points[cell[j]][0], points[cell[j]][1]);
      }

      p.lineTo(points[cell[0]][0], points[cell[0]][1]);

      return p;
    })
    .concat(gridLines);

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
