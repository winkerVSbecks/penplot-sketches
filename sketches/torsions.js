const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { mapRange, lerpFrames, linspace } = require('canvas-sketch-util/math');
const Bezier = require('bezier-js');

const settings = {
  dimensions: [21.59, 13.97],
  // dimensions: [29.7, 21],
  orientation: 'landscape',
  pixelsPerInch: 300,
  units: 'cm',
  scaleToView: true,
  prefix: '29.7x21-',
  animate: true,
  duration: 6,
  fps: 24,
};

const sketch = (props) => {
  const { width, height, units } = props;

  const margin = width / 22;

  const count = 8;

  const w = (width - (count + 1) * margin) / count;

  const paths = linspace(count).map((_, idx) =>
    drawBlock({
      x: margin + (w + margin) * idx,
      y: 2 * margin,
      width: w,
      height: height - 4 * margin,
      thickness: w * 0.02,
      playhead: Math.min(idx / count, 0.99),
    })
  );

  const lines = pathsToPolylines(paths, {
    units: units,
  });

  return (props) =>
    renderPaths(lines, {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.05,
      optimize: true,
    });
};

canvasSketch(sketch, settings);

/**
 *    *       *
 *
 *
 *
 *    b(edge1) b(edge2)
 *    (point where curve starts)
 *
 *
 *    * a c   *
 */
function drawBlock(props) {
  const { x, y, width, height, playhead } = props;
  // Start points for the edge curves
  const b1 = [x, mapRange(playhead, 0, 1, y + height * 1, y)];
  const b2 = [x + width, mapRange(playhead, 0, 1, y + height * 1, y)];

  const edge1 = edge(b1, props, false, true);
  const edge2 = edge(b2, props, true);

  const intersectionProps = intersections(edge1, edge2);

  const path = createPath();

  drawFaces(path, intersectionProps, { x, y, width, height });
  drawFrontEdge(path, edge1);
  return path;
}

function edge(
  b,
  { x, y, width, height, thickness, playhead: rawPlayhead },
  hiddenEdge,
  perspective
) {
  const playhead = hiddenEdge ? 1 - rawPlayhead : rawPlayhead;

  const [aX, cX] = bottomVerticesX({
    width,
    thickness: thickness,
    playhead: playhead,
    x,
  });

  const a = [aX, y + height];
  const c = [cX, y + height];
  const ec1 = edgeCurve(b, a, rawPlayhead);
  const ec2 = edgeCurve(b, c, rawPlayhead, perspective);

  return { ec1, ec2, a, b, c };
}

/**
 *    U       V
 *    *       *
 *
 *    p       q
 *
 *       ta
 *       tb
 *
 *    *  s r  *
 */
function drawFaces(
  path,
  { tA, tB, curve1, curve2, curve3, curve4 },
  { x, y, width }
) {
  const U = [x, y];
  const V = [x + width, y];
  const [p, , , s] = curve3.points;
  const [q, , , r] = curve2.points;

  // Found an intersection
  // draw chunks of front and back parts
  if (tA && tB) {
    path.moveTo(p.x, p.y);
    path.lineTo(...U);
    path.lineTo(...V);
    path.lineTo(q.x, q.y);
    drawBezierCurve(path, curve2.split(tA[0]).left);
    drawBezierCurve(path, curve1.split(tA[1]).left, {
      move: false,
      reverse: true,
    });

    path.moveTo(s.x, s.y);
    drawBezierCurve(path, curve3.split(tB[1]).right, {
      move: false,
      reverse: true,
    });
    drawBezierCurve(path, curve4.split(tB[0]).right, {
      move: false,
    });
    path.closePath();
  } else {
    // No intersection
    // Draw the full front face
    path.moveTo(p.x, p.y);
    path.lineTo(...U);
    path.lineTo(...V);
    path.lineTo(q.x, q.y);
    drawBezierCurve(path, curve2, { move: false });
    path.lineTo(s.x, s.y);
    drawBezierCurve(path, curve3, { move: false, reverse: true });
  }
}

/**
 * Draw the thick edge
 */
function drawFrontEdge(path, { ec1, ec2, a, b, c }) {
  path.moveTo(...b);
  path.bezierCurveTo(...ec1);
  path.moveTo(...b);
  path.bezierCurveTo(...ec2);
  path.lineTo(...a);
}

/**
 * Find intersections between curve pairs
 *
 * Remember we are drawing double curves, so
 * we find intersection between outside curve
 * from one side and inside curve from the other
 *
 *
 * curve1 curve3 curve2 curve4
 */
function intersections(edge1, edge2) {
  const curve1 = new Bezier(...edge1.b, ...edge1.ec2);
  const curve2 = new Bezier(...edge2.b, ...edge2.ec2);

  const curve3 = new Bezier(...edge1.b, ...edge1.ec1);
  const curve4 = new Bezier(...edge2.b, ...edge2.ec1);

  const intersectionsA = curve2.intersects(curve1, 0.1);
  const intersectionsB = curve4.intersects(curve3, 0.1);

  const tA = intersectionsA.map((pair) =>
    pair.split('/').map((v) => parseFloat(v))
  );

  const tB = intersectionsB.map((pair) =>
    pair.split('/').map((v) => parseFloat(v))
  );

  return {
    tA: tA[0],
    tB: tB[0],
    curve1,
    curve2,
    curve3,
    curve4,
  };
}

/**
 * Calculate the X component for
 * the bottom vertices
 */
function bottomVerticesX({ x, width, thickness: s, playhead: t }) {
  const angle = Math.PI + Math.PI * t;
  const r = width / 2;

  const p = [x + r + r * Math.cos(angle), r * Math.sin(angle)];
  const p1 = [p[0] + p[1] * s, p[1] + -p[0] * s];
  const p2 = [p[0] + -p[1] * s, p[1] + p[0] * s];

  return [p1[0], p2[0]];
}

/**
 * The bezier curve definition for the edge curve
 * Returns the two control points and the end point
 */
function edgeCurve([x1, y1], [x2, y2], playhead, perspective) {
  const K1 = 0.37;
  const K2 = perspective
    ? lerpFrames([0, 0, 0.6], playhead)
    : lerpFrames([0, 0, 0.37], playhead);

  const cp1 = [x1, y1 + K1 * (y2 - y1)];
  const cp2 = [x2, y2 - K2 * (y2 - y1)];

  return [...cp1, ...cp2, x2, y2];
}

/**
 * A little utility to draw bezier curves
 * Simply moves to the start point then
 * calls the curve command
 *
 * Optionally allows you to draw the curve in reverse
 */
function drawBezierCurve(path, curve, { move = true, reverse = false } = {}) {
  const [p0, p1, p2, p3] = curve.points;
  if (move) {
    path.moveTo(p0.x, p0.y);
  }
  if (reverse) {
    path.bezierCurveTo(p2.x, p2.y, p1.x, p1.y, p0.x, p0.y);
  } else {
    path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  }
}
