const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: 'a3',
  orientation: 'portrait',
  scaleToView: true,
  prefix: 'a3',
  pixelsPerInch: 300,
  units: 'cm',
};

const sketch = props => {
  const { width, height, units } = props;

  const SUM_THRESHOLD = 1;
  const NUM_CIRCLES = 12;
  const RESOLUTION = 96; //128

  const circles = new Array(NUM_CIRCLES).fill(0).map(() => ({
    x: Random.range(0, width),
    y: Random.range(0, height),
    r: Random.range(width * 0.0625, width * 0.125),
    vx: Random.range(-width * 0.01, width * 0.01),
    vy: Random.range(-width * 0.01, width * 0.01),
  }));

  const paths = [];
  for (let x = 0; x < RESOLUTION; x++) {
    const p = createPath();

    for (let y = 0; y < RESOLUTION; y++) {
      const u = x / (RESOLUTION - 1);
      const v = y / (RESOLUTION - 1);

      const size = width / RESOLUTION / 2;

      const t = {
        x: lerp(0, width, u),
        y: lerp(0, height, v),
      };

      const sum = circles.reduce((sum, c) => {
        const dx = t.x - c.x;
        const dy = t.y - c.y;
        const d2 = dx * dx + dy * dy;
        return sum + (c.r * c.r) / d2;
      }, 0);

      if (sum > SUM_THRESHOLD) {
        p.lineTo(t.x - size, t.y);
      } else {
        p.moveTo(t.x - size, t.y);
      }
    }
    paths.push(p);
  }

  for (let y = 0; y < RESOLUTION; y++) {
    const p = createPath();

    for (let x = 0; x < RESOLUTION; x++) {
      const u = x / (RESOLUTION - 1);
      const v = y / (RESOLUTION - 1);

      const size = width / RESOLUTION / 2;

      const t = {
        x: lerp(0, width, u),
        y: lerp(0, height, v),
      };

      const sum = circles.reduce((sum, c) => {
        const dx = t.x - c.x;
        const dy = t.y - c.y;
        const d2 = dx * dx + dy * dy;
        return sum + (c.r * c.r) / d2;
      }, 0);

      if (sum > SUM_THRESHOLD) {
        p.lineTo(t.x, t.y - size);
      } else {
        p.moveTo(t.x, t.y - size);
      }
    }
    paths.push(p);
  }

  const margin = width * 0.02;
  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  const lines = pathsToPolylines(paths, { units });

  return props =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
      // strokeStyle: 'white',
      // background: '#222',
    });
};

canvasSketch(sketch, settings);
