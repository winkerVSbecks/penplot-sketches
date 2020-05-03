// const { point, line, drawShape } = require('./geometry');
const { createPath } = require('canvas-sketch-util/penplot');
const { matrixMultiply } = require('./matrix');

// prettier-ignore
const cubeEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const faces = {
  top: ([u, v], d, s) => [
    [u - s, d, v - s],
    [u + s, d, v - s],
    [u + s, d, v + s],
    [u - s, d, v + s],
  ],
  right: ([u, v], d, s) => [
    [u - s, v - s, d],
    [u + s, v - s, d],
    [u + s, v + s, d],
    [u - s, v + s, d],
  ],
  left: ([v, u], d, s) => [
    [d, u - s, v - s],
    [d, u + s, v - s],
    [d, u + s, v + s],
    [d, u - s, v + s],
  ],
};

class Renderer3D {
  constructor(
    d,
    angles = { x: Math.atan(1 / 2 ** 0.5), y: Math.PI / 4, z: 0 },
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

    // translate = matrixMultiply(
    //   // prettier-ignore
    // this.rotationX = [
    //     [1, 1, 0],
    //     [0, 1, 0],
    //     [0, 1, 0],
    //   ],
    //   rotated,
    // );

    // prettier-ignore
    const projection = [
      [this.d, 0, 0],
      [0, this.d, 0],
    ];

    const [x, y] = matrixMultiply(projection, rotated).map(
      (v) => v * this.scale,
    );
    return [this.origin[0] / 2 + x, this.origin[1] / 2 + y];
  }

  cube(context, size, stroke) {
    // prettier-ignore
    const cube = [
      [-size, -size, -size],
      [size, -size, -size],
      [size, size, -size],
      [-size, size, -size],
      [-size, -size, size],
      [size, -size, size],
      [size, size, size],
      [-size, size, size],
    ].map(this.convert3dTo2d);

    cubeEdges.forEach(([a, b]) => {
      line(context, cube[a], cube[b], { lineWidth: 1, stroke });
    });
  }

  getFace(direction, size = 0.1, [u, v] = [0, 0], distance = 0.5) {
    return faces[direction]([u, v], distance, size / 2);
  }

  /**
   * Draw a face of the isometric cube
   */
  face(context, faceProps, fill = '#fff', stroke) {
    context.fillStyle = fill;
    const face = this.getFace(...faceProps).map(this.convert3dTo2d);

    // drawShape(context, face);
    context.fill();

    if (stroke) {
      context.strokeStyle = stroke;
      context.stroke();
    }
  }

  line(a, b) {
    const p = createPath();
    p.moveTo(...this.convert3dTo2d(a));
    p.lineTo(...this.convert3dTo2d(b));
    return p;
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

  path([start, ...pts]) {
    const p = createPath();
    p.moveTo(...this.convert3dTo2d(start));
    pts.forEach((pt) => {
      p.lineTo(...this.convert3dTo2d(pt));
    });
    return p;
  }

  shape(context, shape, stroke) {
    context.strokeStyle = stroke;
    // drawShape(context, shape.map(this.convert3dTo2d));
    context.stroke();
  }

  text(context, string, location, direction, fill, font = '16px monospace') {
    const angleY = this.angles.y - Math.PI / 2;
    const rotationY =
      direction === 'right'
        ? [
            [Math.cos(angleY), 0, -Math.sin(angleY)],
            [0, 1, 0],
            [Math.sin(angleY), 0, Math.cos(angleY)],
          ]
        : this.rotationY;
    let r = matrixMultiply(this.rotationX, rotationY);

    const [x, y] = this.convert3dTo2d(location);

    context.save();
    context.font = font;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.fillStyle = fill;
    context.transform(r[0][0], r[1][0], r[0][1], r[1][1], x, y);
    context.fillText(string, 0, 0);
    context.restore();
  }
}

module.exports = Renderer3D;
