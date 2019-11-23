const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const random = require('canvas-sketch-util/random');
const { lerp, mapRange, linspace } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const MarchingSquaresJS = require('marchingsquares');

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

  const isoLines = [];
  const lines = paths
    .filter(() => random.chance())
    .map(([[xMin, xMax], [yMin, yMax]]) => {
      if (random.chance()) {
        isoLines.push(drawIsolines([xMin, xMax], [yMin, yMax]));
      }

      return [
        [xMin, yMin],
        [xMax, yMin],
        [xMax, yMax],
        [xMin, yMax],
      ];
    })
    .map(pts => [...pts, pts[0]]);

  return props =>
    renderPaths([...lines, ...isoLines], {
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

function drawIsolines([xMin, xMax], [yMin, yMax]) {
  const size = xMax - xMin;
  const offset = [xMin, yMin];
  const intervals = linspace(random.rangeFloor(6, 12));
  const gridSize = 100;
  const lines = [];
  const time = Math.sin(random.range(0, 1) * Math.PI);
  let data = [];

  for (let y = 0; y < gridSize; y++) {
    data[y] = [];
    for (let x = 0; x < gridSize; x++) {
      // get a 0..1 UV coordinate
      const u = x / (gridSize - 1);
      const v = y / (gridSize - 1);

      const t = {
        x: lerp(0, size, u),
        y: lerp(0, size, v),
      };

      const scale = gridSize;
      const n = random.noise3D(x / scale, y / scale, time);
      data[y].push(mapRange(n, -1, 1, 0, 1));
    }
  }

  const padding = ((xMax - xMin) * 0.2) / 2;
  intervals.forEach((_, idx) => {
    if (idx > 0) {
      const lowerBand = intervals[idx - 1];
      const upperBand = intervals[idx];
      const band = MarchingSquaresJS.isoBands(
        data,
        lowerBand,
        upperBand - lowerBand,
        {
          successCallback(bands) {
            bands.forEach(band => {
              const scaledBand = band.map(([x, y]) => [
                offset[0] + mapRange(x, 0, 99, 0, size),
                offset[1] + mapRange(y, 0, 99, 0, size),
              ]);

              lines.push(
                clipPolylinesToBox(
                  [drawShape(scaledBand)],
                  [
                    [xMin + padding, yMin + padding],
                    [xMax - padding, yMax - padding],
                  ],
                ),
              );
            });
          },
          noQuadTree: true,
        },
      );
    }
  });

  return lines;
}

function drawShape([start, ...pts]) {
  return [start, ...pts, start];
}
