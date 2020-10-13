const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { mapRange, lerpFrames } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [21.59, 13.97],
  orientation: 'landscape',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  prefix: '8.5x5.5-',
  animate: true,
  duration: 6,
};

const sketch = (props) => {
  const { width, height } = props;

  const margin = width / 22;

  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  return (props) => {
    const paths = [];

    [0, 1, 2, 3, 4, 5, 6].forEach((idx) => {
      const path = block({
        x: margin + margin * 3 * idx,
        y: margin,
        width: margin * 2,
        height: height - margin * 2,
        playhead: Math.abs(
          Math.sin(props.playhead * Math.PI + ((Math.PI / 4) * idx) / 6)
        ),
      });
      paths.push(path);
    });

    const lines = pathsToPolylines(paths, {
      units: props.units,
    });

    // clipPolylinesToBox(lines, clipBox, false, false);
    return renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });
  };
};

canvasSketch(sketch, settings);

/**
 *
 *    *       *
 *
 *
 *
 *    b1      b2
 *    (point where curve starts)
 *
 *
 *    * a c   *
 *
 */
function block(props) {
  const { x, y, width, height, playhead } = props;
  const p = createPath();
  const b1 = [x, mapRange(playhead, 0, 1, y + height * 1, y)];
  const b2 = [x + width, mapRange(playhead, 0, 1, y + height * 1, y)];

  p.moveTo(...b1);
  p.lineTo(x, y);
  p.lineTo(x + width, y);
  p.lineTo(...b2);

  const e1 = edge(p, b1, props);
  const e2 = edge(p, b2, props, true);

  p.moveTo(...e1);
  p.lineTo(...e2);

  return p;
}

function edge(
  p,
  b,
  { x, y, width, height, playhead: rawPlayhead },
  hiddenEdge
) {
  const playhead = hiddenEdge ? 1 - rawPlayhead : rawPlayhead;

  const [e1, e2] = edgeLocations({
    width,
    thickness: width * 0.1,
    playhead: playhead,
    x,
  });

  const a = [e1, y + height];
  const c = [e2, y + height];
  const ec1 = edgeCurve(b, a, rawPlayhead);
  const ec2 = edgeCurve(b, c, rawPlayhead);

  p.moveTo(...b);
  if (!hiddenEdge) {
    p.bezierCurveTo(...ec1);
    p.lineTo(...c);
  }
  p.moveTo(...b);
  p.bezierCurveTo(...ec2);

  return c;
}

function edgeLocations({ x, width, thickness: s, playhead: t }) {
  const angle = Math.PI + Math.PI * t;
  const r = width / 2;

  const p = [x + r + r * Math.cos(angle), r * Math.sin(angle)];
  const p1 = [p[0] + p[1] * s, p[1] + -p[0] * s];
  const p2 = [p[0] + -p[1] * s, p[1] + p[0] * s];

  return [p1[0], p2[0]];
}

const K = 0.37;
function edgeCurve([x1, y1], [x2, y2], playhead) {
  const K1 = 0.37;
  const K2 = lerpFrames([0, 0, 0.37], playhead);

  const cp1 = [x1, y1 + K1 * (y2 - y1)];
  const cp2 = [x2, y2 - K2 * (y2 - y1)];

  return [...cp1, ...cp2, x2, y2];
}

// function edgeCurve({ x, b, height, playhead }) {
//   const a1Off = mapRange(playhead, 0, 1, height * 0, height * 0.5);

//   const cp1 = [b[0], b[1] + a1Off];
//   const cp2 = [x, height - a1Off];

//   return [...cp1, ...cp2, height / 2];
// }

// function edgeCurve({ x, b, height, playhead }) {
//   const a1Off = mapRange(playhead, 0, 1, height * 0, height * 0.5);

//   const a = [x, height];
//   const a1 = [b[0], b[1] + a1Off];
//   const a2 = [x, height];

//   return [...a1, ...a2, ...a];
// }
