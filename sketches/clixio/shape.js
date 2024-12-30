const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const { drawClixo } = require('./draw-clixo');

const settings = {
  dimensions: [21.59, 13.97],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '8.5x5.5-',
};

const sketch = (props) => {
  const { width, height } = props;

  const margin = width * 0.1;
  const w = width - margin * 2;
  const r = w / 6;
  const x = r + margin;
  const y = r + margin;

  const clixioPaths = drawClixo(x, y, r, true);

  return (props) =>
    renderPaths(
      clixioPaths.map((p) => p.toString()),
      {
        ...props,
        lineJoin: 'round',
        lineCap: 'round',
        lineWidth: 0.05,
        optimize: true,
      }
    );
};

canvasSketch(sketch, settings);
