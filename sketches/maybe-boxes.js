const canvasSketch = require('canvas-sketch');
const { pathsToPolylines, renderPaths } = require('canvas-sketch-util/penplot');
const random = require('canvas-sketch-util/random');
const { lerp, linspace } = require('canvas-sketch-util/math');

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

  // const paths = [];

  function maybeSubdivide(boxes, depth) {
    // console.log(depth);
    const paths = [];
    if (depth === 0) return paths;

    boxes.forEach(box => {
      if (random.chance()) {
        const subBoxes = subDivide(
          [box[0][0], box[1][0]],
          [box[0][1], box[2][1]],
          [2, 2],
        );

        // if (depth > 0) {
        paths.push(...maybeSubdivide(subBoxes, depth - 1, paths));
        // } else {
        //   paths.push(...subBoxes);
        // }
      } else {
        paths.push(box);
      }
    });

    return paths;

    // return depth === 0 ? paths : maybeSubdivide(boxes, depth - 1, paths);
  }

  const paths = maybeSubdivide(boxes, 5);

  // boxes.forEach(box => {
  //   if (random.chance()) {
  //     const subBoxes = subDivide(
  //       [box[0][0], box[1][0]],
  //       [box[0][1], box[2][1]],
  //       [2, 2],
  //     );

  //     // paths.push(...subBoxes);
  //     subBoxes.forEach(subBox => {
  //       if (random.chance()) {
  //         const subSubBoxes = subDivide(
  //           [subBox[0][0], subBox[1][0]],
  //           [subBox[0][1], subBox[2][1]],
  //           [2, 2],
  //         );
  //         paths.push(...subSubBoxes);
  //       } else {
  //         paths.push(subBox);
  //       }
  //     });
  //   } else {
  //     paths.push(box);
  //   }
  // });

  lines = paths.filter(() => random.chance()).map(pts => [...pts, pts[0]]);

  return props =>
    renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });

  function subDivide([xMin, xMax], [yMin, yMax], [xSize, ySize]) {
    const boxes = [];
    for (let x = 0; x < xSize; x++) {
      for (let y = 0; y < ySize; y++) {
        const box = [
          [x, y],
          [x + 1, y],
          [x + 1, y + 1],
          [x, y + 1],
        ].map(pt => {
          const u = pt[0] / xSize;
          const v = pt[1] / ySize;
          return [lerp(xMin, xMax, u), lerp(yMin, yMax, v)];
        });

        boxes.push(box);
      }
    }

    return boxes;
  }
};

canvasSketch(sketch, settings);
