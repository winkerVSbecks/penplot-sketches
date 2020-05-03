const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { lerp } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Renderer3D = require('../utils/renderer-3d');

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

  const renderer = new Renderer3D(
    2.5,
    { x: Math.atan(1 / 2 ** 0.5), y: Math.PI / 4, z: 0 },
    width,
    [width, height],
  );

  const margin = 0.05 * width;
  const RESOLUTION = 64;

  const paths = [];

  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  // paths.push(renderer.debug());
  const o = [0, -0.5];

  for (let x = 0; x < RESOLUTION; x++) {
    const lines1 = [];
    const lines2 = [];
    for (let y = 0; y < RESOLUTION; y++) {
      const u = -0.5 + x / (RESOLUTION - 1);
      const v = -0.5 + y / (RESOLUTION - 1);

      const p1 = [u, v];
      const d1 = ((o[0] - p1[0]) ** 2 + (o[1] - p1[1])) ** 2 / 0.5625;
      const t1 = Math.sin(lerp(0, Math.PI * 5, d1));
      lines1.push([p1[0], 0.05 * t1, p1[1]]);

      const p2 = [v, u];
      const d2 = ((o[0] - p2[0]) ** 2 + (o[1] - p2[1])) ** 2 / 0.5625;
      const t2 = Math.sin(lerp(0, Math.PI * 5, d2));
      lines2.push([p2[0], 0.05 * t2, p2[1]]);
    }
    paths.push(renderer.path(lines1));
    paths.push(renderer.path(lines2));
  }

  const lines = pathsToPolylines(paths, { units });

  return (props) =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });
};

canvasSketch(sketch, settings);
