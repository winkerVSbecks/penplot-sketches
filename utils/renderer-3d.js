const { createPath } = require('canvas-sketch-util/penplot');
const { createHatchLines, getBounds } = require('canvas-sketch-util/geometry');
const { matrixMultiply } = require('./matrix');

// prettier-ignore
const cubeEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const faces = {
  top: ([x, y, z], [w, d]) => [
    [x, y, z],
    [x + w, y, z],
    [x + w, y, z + d],
    [x, y, z + d],
  ],
  left: ([x, y, z], [w, h]) => [
    [x, y + h, z],
    [x + w, y + h, z],
    [x + w, y, z],
    [x, y, z],
  ],
  right: ([x, y, z], [d, h]) => [
    [x, y + h, z],
    [x, y, z],
    [x, y, z + d],
    [x, y + h, z + d],
  ],
};

class Renderer3D {
  constructor(
    d,
    angles = { x: Math.atan(1 / 2 ** 0.5), y: (-3 * Math.PI) / 4, z: 0 },
    scale,
    origin,
  ) {
    this.d = d;
    this.scale = scale;
    this.angles = angles;
    this.setRotationX(angles.x);
    this.setRotationY(angles.y);
    this.setRotationZ(angles.z);
    this.convert3dTo2d = this.convert3dTo2d.bind(this);
    this.origin = origin;
  }

  setRotationX(angle) {
    this.angles.x = angle;
    // prettier-ignore
    this.rotationX = [
      [1, 0, 0],
      [0, Math.cos(angle), Math.sin(angle)],
      [0, -Math.sin(angle), Math.cos(angle)],
    ];
  }

  setRotationY(angle) {
    this.angles.y = angle;
    // prettier-ignore
    this.rotationY = [
      [Math.cos(angle), 0, -Math.sin(angle)],
      [0, 1, 0],
      [Math.sin(angle), 0, Math.cos(angle)],
    ];
  }

  setRotationZ(angle) {
    this.angles.z = angle;
    // prettier-ignore
    this.rotationZ = [
      [Math.cos(angle), -Math.sin(angle), 0],
      [Math.sin(angle), Math.cos(angle), 0],
      [0, 0, 1],
    ];
  }

  // http://www.petercollingridge.co.uk/tutorials/svg/isometric-projection/
  convert3dTo2d(vertex) {
    let rotated = matrixMultiply(this.rotationX, this.rotationY);
    rotated = matrixMultiply(
      rotated,
      vertex.map((v) => [v]),
    );

    // prettier-ignore
    const projection = [
      [-this.d, 0, 0],
      [0, this.d, 0],
    ];

    const [x, y] = matrixMultiply(projection, rotated).map(
      (v) => v * this.scale,
    );
    return [this.origin[0] + x, this.origin[1] - y];
  }

  debug() {
    const p = createPath();
    p.moveTo(...this.convert3dTo2d([-0.02, 0, 0]));
    p.lineTo(...this.convert3dTo2d([0.02, 0, 0]));

    p.moveTo(...this.convert3dTo2d([0, -0.02, 0]));
    p.lineTo(...this.convert3dTo2d([0, 0.02, 0]));

    p.moveTo(...this.convert3dTo2d([0, 0, -0.02]));
    p.lineTo(...this.convert3dTo2d([0, 0, 0.02]));

    return p;
  }

  line(a, b) {
    const p = createPath();
    p.moveTo(...this.convert3dTo2d(a));
    p.lineTo(...this.convert3dTo2d(b));
    return p;
  }

  path([start, ...pts], closed = false) {
    const p = createPath();
    p.moveTo(...this.convert3dTo2d(start));
    pts.forEach((pt) => {
      p.lineTo(...this.convert3dTo2d(pt));
    });

    if (closed) {
      p.closePath();
    }

    return p;
  }

  getFace({ direction, size = [0.1, 0.1], location }) {
    const face = faces[direction](location, size);
    return [...face, face[0]];
  }

  /**
   * Draw a face of the isometric cube
   */
  face(faceProps) {
    const face = this.getFace(faceProps);
    return this.path(face, true);
  }

  cuboidGeometry({ size: [w, h, d = w], location: [x, y, z] = [0, 0, 0] }) {
    const top = this.getFace({
      direction: 'top',
      size: [w, d],
      location: [x, y + h, z],
    }).map(this.convert3dTo2d);

    const left = this.getFace({
      direction: 'left',
      size: [w, h],
      location: [x, y, z + d],
    }).map(this.convert3dTo2d);

    const right = this.getFace({
      direction: 'right',
      size: [d, h],
      location: [x + w, y, z],
    }).map(this.convert3dTo2d);

    return [left, right, top];
  }

  cuboid({ size, location }) {
    const geometry = this.cuboidGeometry({ size, location });
    return this.shape(geometry, true);
  }

  cube({ size, location = [0, 0, 0] }) {
    return this.cuboid({ size: [size, size, size], location });
  }

  shape(shape, closed = false) {
    const p = createPath();

    shape.forEach(([start, ...pts]) => {
      p.moveTo(...this.convert3dTo2d(start));

      pts.forEach((pt) => {
        p.lineTo(...this.convert3dTo2d(pt));
      });

      if (closed) {
        p.closePath();
      }
    });

    return p;
  }
}

module.exports = Renderer3D;
