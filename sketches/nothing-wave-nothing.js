const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const { lerp, mapRange } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  // dimensions: [21.59, 13.97],
  dimensions: [29.7, 21],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  // prefix: '8.5x5.5-',
  prefix: '21x29.7-',
};

const sketch = props => {
  const { width, height } = props;

  const gridSize = [40, 40];
  const canvasSize = width * 0.8;
  const size = [
    (canvasSize / gridSize[0]) * 0.5,
    (canvasSize / gridSize[1]) * 0.5,
  ];
  const margin = 0.1 * width;

  const lines = [];

  for (let y = 0; y < gridSize[1]; y++) {
    const line = [];
    for (let x = 0; x < gridSize[0]; x++) {
      const u = x / (gridSize[0] - 1);
      const v = y / (gridSize[1] - 1);

      const tx = lerp(0, width, u);
      const ty = lerp(margin, height - margin, v);

      const scale = Math.sin(mapRange(y, 0, gridSize[1] - 1, 0, Math.PI));
      const amplitude = 2 * size[1] * (scale < Number.EPSILON ? 0 : scale);

      line.push([
        tx,
        ty + Math.sin(mapRange(x, 0, gridSize[0], 0, 7 * Math.PI)) * amplitude,
      ]);

      // const h = ((x, y) => [
      //   x,
      //   Math.sin(mapRange(x, 0, width, 0, 3 * Math.PI)) * y,
      // ])(tx, ty);
      // const heading = Math.atan2(h[1], h[0]);
      // lines.push([
      //   [
      //     tx - size[0] * Math.cos(heading) * 0.75,
      //     ty - size[1] * Math.sin(heading) * 0.75,
      //   ],
      //   [
      //     tx + size[0] * Math.cos(heading) * 0.75,
      //     ty + size[1] * Math.sin(heading) * 0.75,
      //   ],
      // ]);
    }
    lines.push(line);
  }

  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  return props =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });
};

canvasSketch(sketch, settings);
