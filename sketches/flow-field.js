const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const Random = require('canvas-sketch-util/random');
const { lerp } = require('canvas-sketch-util/math');
const Poisson = require('poisson-disk-sampling');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  dimensions: [29.7, 21],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '21x29.7-',
};

const sketch = props => {
  const { width, height } = props;

  const seed = 100; // 0 1000
  const damping = 0.1; // 0 1
  const step = 0.2; // 0 20
  const part_steps = 20; // 0 100
  const frequency = 35; // 0 1000

  Random.setSeed(seed);
  const TAU = Math.PI * 2;

  const PERIOD = 1 / frequency;
  const STEP = step;
  const PART_STEPS = part_steps;

  const SQN = 40;
  const NPART = SQN * SQN;
  const FINENESS = 1;
  const DAMPING = damping;

  const p = new Poisson([width, height], width * 0.05, width * 0.2, NPART);

  const particles = p.fill().map(([x, y]) => ({ x, y }));

  // const particles = [];
  // for (let i = 0; i < NPART; i++) {
  //   particles.push({
  //     x: Random.range(0, width),
  //     y: Random.range(0, height),
  //   });
  // }

  const M = 0.3;

  //const f = (x) => Math.sign(x) * Math.sqrt(Math.abs(x))
  const f = (x, y) => 5;

  const xfn = (n, x, y) => {
    return Math.sin(n); //Math.sin(x / 10 / TAU) + n
  };
  const yfn = (n, x, y) => {
    return Math.cos(n); //Math.cos(y / 10 / TAU) + n
  };

  const lines = particles.map(initial => {
    let pa = [];

    let p = { x: initial.x, y: initial.y, vx: 0, vy: 0 };
    for (let i = 0; i < PART_STEPS * FINENESS; i++) {
      const dist = Math.sqrt((p.x * p.x) / 500 / 500 + (p.y * p.y) / 500 / 500);
      const a = Math.atan2(p.y, p.x) + TAU / 4;
      const n = Random.noise2D(p.x * PERIOD, p.y * PERIOD) * f(p.x, p.y);

      p.vx += lerp(dist, xfn(n, p.x, p.y), Math.abs(Math.cos(a))) * STEP;
      p.vy += lerp(dist, yfn(n, p.x, p.y), Math.abs(Math.sin(a))) * STEP;

      p.x += p.vx / FINENESS;
      p.y += p.vy / FINENESS;
      p.vx *= DAMPING;
      p.vy *= DAMPING;

      pa.push([p.x, p.y]);
      if (p.x < -width || p.x > width || p.y < -height || p.y > height) break;
    }

    return pa;
  });
  console.log(lines.length);

  const margin = 0.05 * width;
  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  return props => {
    const allLines = clipPolylinesToBox(lines, clipBox, false, false);

    const evenLines = [];
    const oddLines = [];

    allLines.forEach((l, idx) => {
      if (idx % 2 === 0) {
        evenLines.push(l);
      } else {
        oddLines.push(l);
      }
    });

    const imgs1 = renderPaths(oddLines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.1,
      optimize: true,
    });

    const imgs2 = renderPaths(evenLines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.1,
      optimize: true,
    });

    return [...imgs1, ...imgs2];
  };
};

canvasSketch(sketch, settings);
