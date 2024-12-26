const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames, clamp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  suffix: Random.getSeed(),
  // dimensions: [29.7, 21],
  dimensions: [21.59, 13.97],
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '8.5x5.5-',
  orientation: 'portrait',
};

const config = {
  resolution: 110,
  walkerCount: 20, // Random.rangeFloor(1, 20),
};

const state = {
  grid: [],
  walkers: [],
};

const sketch = (props) => {
  const { width, height, units } = props;
  state.grid = makeGrid();
  state.walkers = new Array(config.walkerCount).fill(null).map(makeWalker);

  const margin = 0.125 * width;
  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  while (!state.grid.every((cell) => cell.occupied)) {
    console.log('step');

    state.walkers.forEach((walker) => {
      if (walker.state === 'alive') {
        step(walker);
      }
      drawWalker(walker, width, height);
    });
  }

  const paths = state.walkers.map((walker) => walker.line);
  let lines = pathsToPolylines(paths, { units });

  return (props) =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      units,
      optimize: false,
    });
};

/**
 * Walker
 */
// const walkerTypes = [
//   () =>
//     ({ x, y }) =>
//       Random.pick(
//         [
//           { x: x + 1, y: y },
//           { x: x - 1, y: y },
//           { x: x, y: y + 1 },
//           { x: x, y: y - 1 },
//         ].filter(validOption)
//       ),
//   () => {
//     let preferredOption = Random.pick([0, 1]);

//     return ({ x, y }) => {
//       const options = [
//         { x: x + 1, y: y },
//         { x: x - 1, y: y },
//         { x: x, y: y + 1 },
//         { x: x, y: y - 1 },
//       ];
//       let preferred = options[preferredOption];

//       // Try bouncing once
//       if (!validOption(preferred)) {
//         preferredOption = preferredOption === 0 ? 1 : 0;
//         preferred = options[preferredOption];
//       }

//       if (validOption(preferred)) {
//         return preferred;
//       }

//       return Random.pick(options.filter(validOption));
//     };
//   },
//   () => {
//     let preferredOption = Random.pick([2, 3]);

//     return ({ x, y }) => {
//       const options = [
//         { x: x + 1, y: y },
//         { x: x - 1, y: y },
//         { x: x, y: y + 1 },
//         { x: x, y: y - 1 },
//       ];
//       let preferred = options[preferredOption];

//       // Try bouncing once
//       if (!validOption(preferred)) {
//         preferredOption = preferredOption === 2 ? 3 : 2;
//         preferred = options[preferredOption];
//       }

//       if (validOption(preferred)) {
//         return preferred;
//       }

//       return Random.pick(options.filter(validOption));
//     };
//   },
// ];

const walkerTypes = [
  () =>
    ({ x, y }) =>
      Random.pick(
        [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 },
        ].filter(validOption)
      ),
  () =>
    ({ x, y }) => {
      const preferred = { x: x + 1, y: y };

      if (validOption(preferred)) {
        return preferred;
      }

      return Random.pick(
        [
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 },
        ].filter(validOption)
      );
    },
  () =>
    ({ x, y }) => {
      const preferred = { x: x - 1, y: y };

      if (validOption(preferred)) {
        return preferred;
      }

      return Random.pick(
        [
          { x: x + 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 },
        ].filter(validOption)
      );
    },
  () =>
    ({ x, y }) => {
      const preferred = { x: x, y: y + 1 };

      if (validOption(preferred)) {
        return preferred;
      }

      return Random.pick(
        [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y - 1 },
        ].filter(validOption)
      );
    },
  () =>
    ({ x, y }) => {
      const preferred = { x: x, y: y - 1 };

      if (validOption(preferred)) {
        return preferred;
      }

      return Random.pick(
        [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
        ].filter(validOption)
      );
    },
];

function spawnWalker() {
  const doSpawn = !state.grid.every((cell) => cell.occupied);

  if (doSpawn) {
    const walker = makeWalker();

    if (walker) {
      state.walkers.push(walker);
    }
  }
}

function makeWalker() {
  const start = getStart();

  if (start) {
    (start.moveTo = true), setOccupied(start);

    return {
      path: [start],
      state: 'alive',
      nextStep: Random.pick(walkerTypes)(),
      line: createPath(),
    };
  }
  return null;
}

function getStart() {
  return Random.pick(state.grid.filter((cell) => !cell.occupied));
}

function step(walker) {
  let currentIndex = walker.path.length - 1;
  let current = walker.path[currentIndex];
  let next = walker.nextStep(current);

  if (next) {
    setOccupied(next);
    walker.path.push(next);
  } else {
    walker.state = 'dead';
    spawnWalker();
  }
}

function drawWalker(walker, width, height) {
  walker.path.map(({ x, y, moveTo }) => {
    const operation = moveTo ? 'moveTo' : 'lineTo';
    walker.line[operation](...xyToCoords(x, y, width, height));
  });
}

/**
 * Grid
 */
function makeGrid() {
  const grid = [];

  for (let y = 0; y <= config.resolution; y++) {
    for (let x = 0; x <= config.resolution; x++) {
      grid.push({ x, y, occupied: false });
    }
  }

  return grid;
}

function isOccupied({ x, y }) {
  const idx = xyToIndex(x, y);
  return state.grid[idx].occupied;
}

function setOccupied({ x, y }) {
  const idx = xyToIndex(x, y);
  if (idx >= 0) {
    state.grid[idx].occupied = true;
  }
}

function validOption(option) {
  return inBounds(option) && !isOccupied(option);
}

/**
 * Utils
 */
// i = x + width*y;
function xyToIndex(x, y) {
  return x + (config.resolution + 1) * y;
}

function inBounds({ x, y }) {
  return x >= 0 && x <= config.resolution && y >= 0 && y <= config.resolution;
}

function xyToCoords(x, y, width, height) {
  return [(x * width) / config.resolution, (y * height) / config.resolution];
}

canvasSketch(sketch, settings);
