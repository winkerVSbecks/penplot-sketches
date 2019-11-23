const canvasSketch = require('canvas-sketch');
const { pathsToSVG } = require('canvas-sketch-util/penplot');
const random = require('canvas-sketch-util/random');
const { lerp } = require('canvas-sketch-util/math');

const settings = {
  dimensions: 'a4',
  pixelsPerInch: 300,
  units: 'cm',
};

const sketch = ({ width, height, units, render }) => {
  const lines = [];
  // Thickness of pen in cm
  const penThickness = 0.03;
  const polygonLayers = 6;

  const gridSize = [6, 12];
  const padding = width * 0.2;
  const tileSize = [
    (width - padding * 2) / gridSize[0],
    (height - padding * 2) / gridSize[1],
  ];

  return ({ context }) => {
    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Fill with white
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    for (let x = 0; x < gridSize[0]; x++) {
      for (let y = 0; y < gridSize[1]; y++) {
        // get a 0..1 UV coordinate
        const u = gridSize[0] <= 1 ? 0.5 : x / (gridSize[0] - 1);
        const v = gridSize[1] <= 1 ? 0.5 : y / (gridSize[1] - 1);

        // scale to dimensions with a border padding
        const tx = lerp(padding, width - padding, u);
        const ty = lerp(padding, height - padding, v);

        const polygons = Array.from(new Array(polygonLayers)).map((_, idx) => {
          const scale = lerp(0.1, 1, (idx + 1) / polygonLayers);

          return polygon({
            w: tileSize[0] * scale,
            h: tileSize[1] * scale,
            origin: [tx, ty],
          });
        });

        polygons.forEach(points => {
          drawPolygon(context, points);
          lines.push(points);
        });
      }
    }

    return [
      // Export PNG as first layer
      context.canvas,
      // Export SVG for pen plotter as second layer
      {
        data: pathsToSVG(lines, {
          width,
          height,
          units,
        }),
        extension: '.svg',
      },
    ];
  };

  function drawPolygon(context, points) {
    context.save();
    context.beginPath();
    points.forEach(p => context.lineTo(p[0], p[1]));
    context.strokeStyle = 'black';
    context.lineWidth = penThickness;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke();
    context.restore();
  }

  function polygon({ w, h, origin }) {
    const path = [
      randomPointIn([0.05 * w, 0.5 * w], [0.2 * h, 0.5 * h], origin),
      randomPointIn([-0.5 * w, -0.05 * w], [0.05 * h, 0.2 * h], origin),
      randomPointIn([-0.5 * w, -0.05 * w], [-0.3 * h, -0.05 * h], origin),
      randomPointIn([-0.25 * w, 0.05 * w], [-0.5 * h, -0.3 * h], origin),
      randomPointIn([0.05 * w, 0.5 * w], [-0.4 * h, -0.05 * h], origin),
    ];

    path.push(path[0]);
    return path;
  }
};

canvasSketch(sketch, settings);

function randomPointIn([xMin, xMax], [yMin, yMax], [x, y]) {
  return [x + random.range(xMin, xMax), y + random.range(yMin, yMax)];
}
