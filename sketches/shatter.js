const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const { linspace, lerpArray } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

// You can force a specific seed by replacing this with a string value
const defaultSeed = '';

// Set a random seed so we can reproduce this print later
Random.setSeed(defaultSeed || Random.getRandomSeed());

// Print to console so we can see which seed is being used and copy it if desired
console.log('Random Seed:', Random.getSeed());

const settings = {
  suffix: Random.getSeed(),
  dimensions: [21.59, 13.97],
  orientation: 'landscape',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = (props) => {
  const { width, height, units } = props;

  const R = width / 4;
  // const center = [0, 0 + R / 4];
  const center = [width / 2, height / 2 + R / 4];

  const [a, b, c] = triangle(center, R);

  let t1 = 0;
  let t2 = 0;
  let t3 = 0;
  let t4 = 0;
  let paths = [];
  let state = 'ab';

  while (t3 < 1) {
    const newState = nextState(state, t1, t2, t3, t4, [a, b, c]);
    paths.push(newState.path);
    state = newState.state;
    t1 = newState.t1;
    t2 = newState.t2;
    t3 = newState.t3;
    t4 = newState.t4;
  }

  const lines = paths.map(pathToLine);

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

function nextState(state, t1, t2, t3, t4, [a, b, c]) {
  let path,
    wraps = false;

  t3 = Math.min(Random.range(t1, t1 + 0.25), 1);
  t3 = t3 > 0.95 ? 1 : t3;
  t4 =
    state === 'ab'
      ? Random.range(t2, t2 + 0.75)
      : Math.min(Random.range(t2, t2 + 0.25), 1);

  if (t3 === 1) {
    t4 = 1;
  }

  const u = lerpArray(a, c, t1);
  const v = state === 'ab' ? lerpArray(a, b, t2) : lerpArray(b, c, t2);

  if (t2 <= 1 && t4 > 1) {
    state = 'bc';
    wraps = true;
    t4 = Random.range(0.1, 0.25);
  }

  const w = state === 'ab' ? lerpArray(a, b, t4) : lerpArray(b, c, t4);
  const x = lerpArray(a, c, t3);

  path = wraps ? [u, v, b, w, x] : [u, v, w, x];

  t1 = Math.min(t3 + 0.05, 1);
  t2 = Math.min(nextT2(state, t1, t3, t4), 1);

  return {
    state,
    path,
    t1,
    t2,
    t3,
    t4,
  };
}

function nextT2(state, t1, t3, t4) {
  if (state === 'ab') {
    return (t4 * t1) / t3;
  }

  const t1Prime = 1 - t1;
  const t3Prime = 1 - t3;
  const t4Prime = 1 - t4;

  return 1 - (t4Prime * t1Prime) / t3Prime;
}

function triangle([x, y], R) {
  return linspace(3).map((_, step) => [
    x + R * Math.cos((step * 2 * Math.PI) / 3 + Math.PI / 6),
    y + R * Math.sin((step * 2 * Math.PI) / 3 + Math.PI / 6),
  ]);
}

function pathToLine(pts) {
  const [first, ...rest] = pts;
  return [first, ...rest, first];
}
