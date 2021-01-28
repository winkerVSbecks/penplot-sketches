const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const { lerpArray } = require('canvas-sketch-util/math');

const settings = {
  // dimensions: [29.7, 21],
  // prefix: '29.7x21-',
  dimensions: [21.59, 13.97],
  prefix: '8.5x5.5-',
  orientation: 'portrait',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = (props) => {
  const { width, height, units } = props;

  const paths = [];
  const margin = 0.5;

  const res = [4, 8];
  const size = [(width - 2 * margin) / res[0], (height - 2 * margin) / res[1]];

  for (let y = 0; y < res[1]; y++) {
    for (let x = 0; x < res[0]; x++) {
      const pizza = makePizza(
        [margin + (x + 0.5) * size[0], margin + (y + 0.5) * size[1]],
        [size[0] * 0.25, size[1] * 0.25]
      );
      paths.push(pizza);
    }
  }

  let lines = pathsToPolylines(paths, { units });

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

function makePizza([cx, cy], [a, b]) {
  const angles = randomAngles();
  const crustScale = 1.15;
  const crustAngleOff = Math.PI * 0.01;

  const base = angles.map((angle) => pointOnEllipse([cx, cy], angle, a, b));
  const crust = [
    angles[0],
    angles[1] - crustAngleOff,
    angles[2] + crustAngleOff,
  ].map((angle) =>
    pointOnEllipse([cx, cy], angle, a * crustScale, b * crustScale)
  );

  const droopSide = base[1][1] < base[2][1] ? 2 : 1;

  const p = createPath();

  // Draw base
  p.moveTo(...base[0]);
  p.lineTo(...base[1]);
  p._ += `A ${a} ${b} 0 0 1 ${base[2][0]} ${base[2][1]}`;
  p.lineTo(...base[0]);

  // Draw cheese
  [0, 1, 2]
    .map(() => Random.chance(0.75))
    .forEach((doDraw, idx) => {
      if (doDraw) {
        getCheese(
          base,
          droopSide,
          {
            location: Random.range(0 + 0.3 * idx, 0.25 + 0.35 * idx),
            thickness: Random.range(0.05, 0.075),
            length: Random.range(b * 0.25, b * 0.75),
          },
          p
        );
      }
    });

  // Draw crust
  p.moveTo(...crust[1]);
  p._ += `A ${a * crustScale} ${b * crustScale} 0 0 1 ${crust[2][0]} ${
    crust[2][1]
  }`;

  // draw pepperonis
  const pepperonis = getPepperonis(base, {
    radius: a * 0.1,
    count: Random.rangeFloor(3, 5),
  });

  pepperonis.forEach((pepperoni) => {
    p.moveTo(pepperoni[0] + a * 0.1, pepperoni[1]);
    p.arc(pepperoni[0], pepperoni[1], a * 0.1, 0, 2 * Math.PI);
  });

  return p;
}

function randomAngles() {
  const first = Random.range(0, Math.PI * 2);
  const second = first + Random.range(Math.PI * 0.5, Math.PI);
  const third = second + Random.range(Math.PI * 0.3, Math.PI * 0.4);
  return [first, second, third];
}

function pointOnEllipse([cx, cy], theta, a, b) {
  return [cx + a * Math.cos(theta), cy + b * Math.sin(theta)];
}

function randomPointInTriangle(triangle) {
  let wb = Math.random();
  let wc = Math.random();

  // point will be outside of the triangle, invert weights
  if (wb + wc > 1) {
    wb = 1 - wb;
    wc = 1 - wc;
  }

  const [a, b, c] = triangle.map((coords) => ({ x: coords[0], y: coords[1] }));

  const rb_x = wb * (b.x - a.x);
  const rb_y = wb * (b.y - a.y);
  const rc_x = wc * (c.x - a.x);
  const rc_y = wc * (c.y - a.y);

  const r_x = rb_x + rc_x + a.x;
  const r_y = rb_y + rc_y + a.y;

  return [r_x, r_y];
}

function getPepperonis(base, { radius, count }) {
  const pepperonis = [];

  while (pepperonis.length <= count) {
    const pepperoni = randomPointInTriangle(base);
    const valid = pepperonis.reduce(
      (res, pt) => res && !circleCollide(pepperoni, pt, radius),
      true
    );

    if (valid) {
      pepperonis.push(pepperoni);
    }
  }

  return pepperonis;
}

function circleCollide([x1, y1], [x2, y2], r) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  return dist <= r + r ? true : false;
}

function getCheese(base, droopSide, { location, length, thickness }, path) {
  let cheeseA = lerpArray(base[0], base[droopSide], location);
  let cheeseB = lerpArray(base[0], base[droopSide], location + thickness);

  [cheeseA, cheeseB] =
    cheeseA[0] < cheeseB[0] ? [cheeseB, cheeseA] : [cheeseA, cheeseB];

  const cheeseCenter = (cheeseA[0] + cheeseB[0]) / 2;
  const cheeseRadius = (cheeseA[0] - cheeseB[0]) / 2;

  path.moveTo(...cheeseA);
  path.lineTo(cheeseA[0], cheeseA[1] + length);
  path.arc(cheeseCenter, cheeseA[1] + length, cheeseRadius, 0, Math.PI);
  path.lineTo(cheeseB[0], cheeseB[1]);
}
