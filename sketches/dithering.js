const canvasSketch = require('canvas-sketch');
const load = require('load-asset');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const Random = require('canvas-sketch-util/random');
const Poisson = require('poisson-disk-sampling');

const settings = {
  dimensions: [29.7, 21],
  prefix: '29.7x21-',
  // dimensions: [21.59, 13.97],
  // prefix: '8.5x5.5-',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = async (props) => {
  const image = await load('../imgs/cloud.png');
  const { width, height, units } = props;

  var offscreen = new OffscreenCanvas(width, height);
  var context = offscreen.getContext('2d');

  context.drawImage(image, 0, width * 0.25, width, width);
  // const pixels = context.getImageData(0, width * 0.25, width, width);
  // const data = pixels.data;

  const poissonDiskSamples = new Poisson({
    shape: [width, height],
    minDistance: 0.5,
    maxDistance: 4,
    tries: 20,
    bias: 1,
    distanceFunction: function (p) {
      const pixel = context.getImageData(p[0], p[1], 1, 1).data;
      return (pixel[0] + pixel[1] + pixel[2]) / (255 * 3);
    },
  });

  const paths = [];

  poissonDiskSamples.fill().forEach(([x, y]) => {
    const p = createPath();
    p.arc(x, y, 0.125 / 2, 0, Math.PI * 2);
    paths.push(p);
  });

  let lines = pathsToPolylines(paths, { units });

  const margin = 1;
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
