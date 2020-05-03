const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const Random = require('canvas-sketch-util/random');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const clipPolygon = require('../utils/clip-polygon');

const settings = {
  dimensions: [21.59, 13.97],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '8.5x5.5-',
};

const sketch = (props) => {
  const { width, height, units } = props;

  const RESOLUTION = 24;
  const paths = [];

  const s = width / RESOLUTION;
  const clipBox = [
    [s, s],
    [width - s, height - s],
  ];

  paths.push(jali(...clipBox));

  for (let x = 0; x < width; x += s) {
    for (let y = 0; y < height; y += s) {
      const tile = Random.pick(arcSweeps(2));
      paths.push(tile([x, y], s));
    }
  }

  const lines = pathsToPolylines(paths, { units });
  // const jaliLine = pathsToPolylines(jali(...clipBox), { units })[0];
  const jaliLine = pathsToPolylines(
    [
      [width / 2, s],
      [width - s, 0.4 * height],
      [width - s, height - s],
      [s, height - s],
      [s, 0.4 * height],
    ],
    { units },
  )[0];

  const clippedLines = lines.map((line) => clipPolygon(line, jaliLine));

  return (props) =>
    renderPaths(clippedLines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.1,
      optimize: true,
    });
};

canvasSketch(sketch, settings);

const crossOVerArcs = [
  function ([x, y], s) {
    const p = createPath();

    p.moveTo(x + s / 2, y);
    p.lineTo(x + s / 2, y + s / 4);

    p.moveTo(x + s / 2, y + s / 2 + s / 4);
    p.lineTo(x + s / 2, y + s);

    p.moveTo(x, y + s / 2);
    p.lineTo(x + s, y + s / 2);

    return p;
  },
  function ([x, y], s) {
    const p = createPath();

    p.arc(x, y, s / 2, 0, Math.PI / 2);

    p.moveTo(x + s / 2, y + s);
    p.arc(x + s, y + s, s / 2, Math.PI, (3 * Math.PI) / 2);

    return p;
  },
  function ([x, y], s) {
    const p = createPath();

    p.arc(x, y + s, s / 2, (3 * Math.PI) / 2, 0);

    p.moveTo(x + s, y + s / 2);
    p.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);

    return p;
  },
];

const arcs = [
  function ([x, y], s) {
    const p = createPath();
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x, y, s / 2, 0, Math.PI / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x + s, y + s, s / 2, Math.PI, (3 * Math.PI) / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x, y + s, s / 2, (3 * Math.PI) / 2, 0);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x, y, s / 2, 0, Math.PI / 2);
    p.arc(x, y + s, s / 2, (3 * Math.PI) / 2, 0);
    p.arc(x + s, y + s, s / 2, Math.PI, (3 * Math.PI) / 2);
    p.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);
    return p;
  },
];

const diagonals = [
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x, y + s / 2);
    p.lineTo(x + s / 2, y + s);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y + s);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
];

const diagonalMesh = [
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x, y + s / 2);
    p.moveTo(x + s / 2, y + s);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x, y + s / 2);
    p.lineTo(x + s / 2, y + s);
    p.moveTo(x + s / 2, y);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x + s / 2, y + s);
    p.moveTo(x, y + s / 2);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
];

const overlappingArcs = [
  function ([x, y], s) {
    const r = s / 4;
    const p = createPath();
    p.arc(x, y, r, 0, Math.PI / 2);
    p.moveTo(x + 2 * r, y);
    p.arc(x, y, r * 2, 0, Math.PI / 2);
    p.moveTo(x + 3 * r, y);
    p.arc(x, y, r * 3, 0, Math.PI / 2);
    p.moveTo(x + s - r, y + s);
    p.arc(x + s, y + s, r, Math.PI, (3 * Math.PI) / 2);
    p.moveTo(x + s - 2 * r, y + s);
    p.arc(x + s, y + s, r * 2, Math.PI, (3 * Math.PI) / 2);
    p.moveTo(x + s - 3 * r, y + s);
    p.arc(x + s, y + s, r * 3, Math.PI, (3 * Math.PI) / 2);
    return p;
  },
  function ([x, y], s) {
    const r = s / 4;
    const p = createPath();
    p.arc(x + s, y, r, Math.PI / 2, Math.PI);
    p.moveTo(x + s, y + 2 * r);
    p.arc(x + s, y, r * 2, Math.PI / 2, Math.PI);
    p.moveTo(x + s, y + 3 * r);
    p.arc(x + s, y, r * 3, Math.PI / 2, Math.PI);
    p.moveTo(x + r, y + s);
    p.arc(x, y + s, r, (3 * Math.PI) / 2, 2 * Math.PI);
    p.moveTo(x + 2 * r, y + s);
    p.arc(x, y + s, r * 2, (3 * Math.PI) / 2, 2 * Math.PI);
    p.moveTo(x + 3 * r, y + s);
    p.arc(x, y + s, r * 3, (3 * Math.PI) / 2, 2 * Math.PI);
    return p;
  },
];

const arcSweeps = (count) => [
  rail(count, 'H'),
  rail(count, 'V'),
  arc(count, 'TL'),
  arc(count, 'TR'),
  arc(count, 'BL'),
  arc(count, 'BR'),
];

function rail(count, dir) {
  return ([x, y], s) => {
    const r = s / count;
    const p = createPath();

    if (dir === 'V') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + i * r, y);
        p.lineTo(x + i * r, y + s);
      }
    } else if (dir === 'H') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x, y + i * r);
        p.lineTo(x + s, y + i * r);
      }
    }

    return p;
  };
}

function arc(count, dir) {
  return ([x, y], s) => {
    const r = s / count;
    const p = createPath();

    if (dir === 'TL') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + i * r, y);
        p.arc(x, y, i * r, 0, Math.PI / 2);
      }
    } else if (dir === 'TR') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + s, y + i * r);
        p.arc(x + s, y, i * r, Math.PI / 2, Math.PI);
      }
    } else if (dir === 'BR') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + s - i * r, y + s);
        p.arc(x + s, y + s, i * r, Math.PI, (3 * Math.PI) / 2);
      }
    } else if (dir === 'BL') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x, y + s - i * r);
        p.arc(x, y + s, i * r, (3 * Math.PI) / 2, 2 * Math.PI);
      }
    }

    return p;
  };
}

function jali([ox, oy], [w, h]) {
  const p = createPath();
  const l = 0.5 * h;

  p.moveTo(ox, l);
  p.lineTo(ox, h);
  p.lineTo(w, h);
  p.lineTo(w, l);
  p.bezierCurveTo(w, 0.254 * h, w, 0.4 * l, w / 2, oy);
  p.bezierCurveTo(ox, 0.4 * l, ox, 0.254 * h, ox, l);

  return p;
}
