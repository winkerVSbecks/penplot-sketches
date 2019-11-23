const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const random = require('canvas-sketch-util/random');
const { lerp } = require('canvas-sketch-util/math');

const settings = {
  dimensions: 'A4',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = ({ width, height, units, render }) => {
  const gridSize = [3, 4];
  const padding = width * 0.2;
  const tileSize = (width - padding * 2) / gridSize[0];

  const marginY = (height - 4 * tileSize) / 2;

  const boxes = subDivide(
    [padding, width - padding],
    [marginY, height - marginY],
    [3, 4],
  );

  function maybeSubdivide(boxes, depth) {
    const paths = [];

    if (depth === 0) return paths;

    boxes.forEach(box => {
      if (random.chance()) {
        const subBoxes = subDivide(...box, [2, 2]);

        paths.push(...maybeSubdivide(subBoxes, depth - 1, paths));
      } else {
        paths.push(box);
      }
    });

    return paths;
  }

  const paths = maybeSubdivide(boxes, 2);

  const lines = paths
    .filter(() => random.chance())
    .map(([[xMin, xMax], [yMin, yMax]]) => [
      [xMin, yMin],
      [xMax, yMin],
      [xMax, yMax],
      [xMin, yMax],
    ])
    .map(pts => [...pts, pts[0]]);

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

function subDivide([xMin, xMax], [yMin, yMax], [xSize, ySize]) {
  const boxes = [];
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      const box = [
        [x, x + 1].map(v => lerp(xMin, xMax, v / xSize)),
        [y, y + 1].map(v => lerp(yMin, yMax, v / ySize)),
      ];

      boxes.push(box);
    }
  }

  return boxes;
}
