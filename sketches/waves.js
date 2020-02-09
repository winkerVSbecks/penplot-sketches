const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const pack = require('pack-spheres');
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
  Random.setSeed(seed);

  let leftX = 0; //width * -0.5;
  let rightX = width; //width * 1.5;
  let topY = 0; //height * -0.5;
  let bottomY = height; //height * 1.5;

  const resolution = width * 0.01;
  const stepLength = 0.01 * width; // 0.1% to 0.5% of the image width
  const numSteps = 20;
  const numParticles = 2500;

  let numColumns = Math.round((rightX - leftX) / resolution);
  let numRows = Math.round((bottomY - topY) / resolution);

  const grid = [];

  for (let col = 0; col < numColumns; col++) {
    for (let row = 0; row < numRows; row++) {
      // Noise works best when the step between
      // points is approximately 0.005, so scale down to that
      const scaledX = col * 0.003;
      const scaledY = row * 0.003;
      // get our noise value, between 0.0 and 1.0
      const noiseVal = Random.noise2D(scaledX, scaledY);
      // translate the noise value to an angle (between 0 and 2 * PI)
      angle = mapRange(noiseVal, 0, 1, 0, 2 * Math.PI);

      grid[col + numColumns * row] = angle;
    }
  }

  // // Circle Packing
  // const particles = pack({
  //   dimensions: 2,
  //   packAttempts: numParticles / 5,
  //   maxCount: numParticles / 5,
  //   minRadius: 0.00125 / 2,
  //   maxRadius: 0.1,
  //   padding: 0,
  // }).map(circle => ({
  //   x: mapRange(circle.position[0], -1, 1, 0, width),
  //   y: mapRange(circle.position[1], -1, 1, 0, height),
  // }));

  // // Grid
  // const particles = [];
  // const res = 20;
  // for (let x = 0; x < res; x++) {
  //   for (let y = 0; y < res; y++) {
  //     particles.push({ x: (x * width) / res, y: (y * height) / res });
  //   }
  // }

  // Poisson Disk
  const p = new Poisson(
    [width, height],
    width * 0.05,
    width * 0.5,
    numParticles * 100,
  );
  const particles = p.fill().map(([x, y]) => ({ x, y }));

  // // Random
  // const particles = [];
  // for (let i = 0; i < numParticles / 4; i++) {
  //   particles.push({
  //     x: Random.range(0, width),
  //     y: Random.range(0, height),
  //   });
  // }

  const lines = particles.map(initial => drawCurve(initial));

  function drawCurve(initial) {
    const line = [];
    let { x, y } = initial;

    for (let n = 0; n < numSteps; n++) {
      line.push([x, y]);

      const xOffset = x - leftX;
      const yOffset = y - topY;
      const columnIndex = Math.round(xOffset / resolution);
      const rowIndex = Math.round(yOffset / resolution);

      // NOTE: normally you want to check the bounds here
      const gridAngle = grid[columnIndex + numColumns * rowIndex];
      const xStep = stepLength * Math.cos(gridAngle);
      const yStep = stepLength * Math.sin(gridAngle);

      x = x + xStep;
      y = y + yStep;
    }

    return line;
  }

  const margin = 0.05 * width;
  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  return props =>
    renderPaths(clipPolylinesToBox(lines, clipBox, false, false), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.1,
      optimize: true,
      // background: '#000',
      strokeStyle: 'rgba(255, 183, 0)',
    });
};

canvasSketch(sketch, settings);
