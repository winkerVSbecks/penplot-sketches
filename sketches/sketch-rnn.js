/**
 * Inspired Letter collages by Deborah Schmidt
 * http://frauzufall.de/en/2017/google-quick-draw/
 */
const canvasSketch = require('canvas-sketch');
const _ = require('lodash');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const pack = require('pack-spheres');
const ms = require('@magenta/sketch');
const drawingData = require('../quickdraw-dataset/circle_5000.json');

const settings = {
  dimensions: 'letter',
  orientation: 'portrait',
  scaleToView: true,
  prefix: 'letter',
  pixelsPerInch: 300,
  units: 'cm',
};

const sketch = async props => {
  const { width, height, units } = props;

  let modelState;
  const temperature = 0.45; // Controls the amount of uncertainty of the model.
  let dx, dy; // Offsets of the pen strokes, in pixels.
  let x, y; // Absolute coordinates on the screen of where the pen is.
  let pen = [0, 0, 0]; // Current pen state, [pen_down, pen_up, pen_end].
  let previousPen = [1, 0, 0]; // Previous pen state.
  const PEN = { DOWN: 0, UP: 1, END: 2 };

  const model = new ms.SketchRNN(
    'https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/steak.gen.json',
  );

  await model.initialize().then(function() {
    // Initialize the scale factor for the model. Bigger -> large outputs
    model.setPixelFactor(3 * height);
    restart();
  });

  function restart() {
    x = width / 2;
    y = height / 3;
    [dx, dy, ...pen] = model.zeroInput(); // Reset the pen state.
    modelState = model.zeroState(); // Reset the model state.
  }

  function sampleNewState() {
    // Using the previous pen states, and hidden state, get next hidden state
    // the below line takes the most CPU power, especially for large models.
    modelState = model.update([dx, dy, ...pen], modelState);
    // Get the parameters of the probability distribution (pdf) from hidden state.
    const pdf = model.getPDF(modelState, temperature);
    // Sample the next pen's states from our probability distribution.
    return model.sample(pdf);
  }

  const paths = [];
  const p = createPath();
  p.moveTo(x, y);

  function draw() {
    // New state.
    [dx, dy, ...pen] = sampleNewState();

    // Update the absolute coordinates from the offsets
    x += dx;
    y += dy;

    // Only draw on the paper if the pen is still touching the paper.
    if (previousPen[PEN.DOWN] == 1) {
      p.lineTo(x, y); // Draw line connecting prev point to current point.
    } else {
      p.moveTo(x, y);
    }

    // Update the previous pen's state to the current one we just sampled.
    previousPen = pen;

    if (previousPen[PEN.END] === 1) {
      paths.push(p);
    } else {
      draw();
    }
  }
  draw();

  // const circles = pack({
  //   dimensions: 2,
  //   bounds,
  //   sample: () => Random.insideCircle(bounds),
  //   packAttempts: 500,
  //   maxCount: 500,
  //   minRadius: 0.06 * bounds,
  //   maxRadius: 0.4 * bounds,
  //   padding: 0.005 * bounds,
  // }).map(c => {
  //   const r = c.radius - 2 * c.padding;

  //   const x = mapRange(
  //     c.position[0],
  //     -bounds,
  //     bounds,
  //     width * 0.5 - bounds,
  //     width * 0.5 + bounds,
  //   );
  //   const y = mapRange(
  //     c.position[1],
  //     -bounds,
  //     bounds,
  //     height * 0.5 - bounds,
  //     height * 0.5 + bounds,
  //   );

  //   return [
  //     [x - r, x + r],
  //     [y - r, y + r],
  //   ];
  // });

  // const scaleTo = ([xMin, xMax], [yMin, yMax]) => stroke => {
  //   const xs = stroke[0].map(x => mapRange(x, 0, 255, xMin, xMax));
  //   const ys = stroke[1].map(y => mapRange(y, 0, 255, yMin, yMax));
  //   return [xs, ys];
  // };

  // const strokeToLine = stroke => _.zip(stroke[0], stroke[1]);

  // const drawings = drawingData.map(d => d.drawing);

  // const drawingToScaledLine = (strokes, bounds) =>
  //   strokes.map(scaleTo(...bounds)).map(strokeToLine);

  // const lines = circles.map(bounds =>
  //   drawingToScaledLine(Random.pick(drawings), bounds),
  // );

  const lines = pathsToPolylines(paths, { units });

  return props =>
    renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });
};

canvasSketch(sketch, settings);
