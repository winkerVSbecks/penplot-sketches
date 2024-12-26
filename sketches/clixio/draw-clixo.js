const { createPath } = require('canvas-sketch-util/penplot');

const PI = Math.PI;

export function drawClixo(x, y, r) {
  const anchors = [
    [x, y],
    [x + 2 * r, y],
    [x + 4 * r, y],
    [x + 4 * r, y + 2 * r],
    [x + 4 * r, y + 4 * r],
    [x + 2 * r, y + 4 * r],
    [x, y + 4 * r],
    [x, y + 2 * r],
  ];

  const a = [
    { x, y },
    { x: x + 2 * r, y: y },
    { x: x + 4 * r, y: y },
    { x: x + 4 * r, y: y + 2 * r },
    { x: x + 4 * r, y: y + 4 * r },
    { x: x + 2 * r, y: y + 4 * r },
    { x: x, y: y + 4 * r },
    { x: x, y: y + 2 * r },
  ];

  const base = createPath((context) => {
    context.moveTo(x, y + r);
    context.arcTo(x - r, y + r, x - r, y - r, r);
    context.arcTo(x - r, y - r, x + r, y - r, r);
    context.arcTo(x + r, y - r, x + r, y + r, r);

    context.arcTo(a[1].x - r, a[1].y + r, a[1].x + r, a[1].y + r, r);
    context.arcTo(a[1].x + r, a[1].y + r, a[1].x + r, a[1].y - r, r);

    context.arcTo(a[2].x - r, a[2].y - r, a[2].x + r, a[2].y - r, r);
    context.arcTo(a[2].x + r, a[2].y - r, a[2].x + r, a[2].y + r, r);
    context.arcTo(a[2].x + r, a[2].y + r, a[2].x - r, a[2].y + r, r);

    context.arcTo(a[3].x - r, a[3].y - r, a[3].x - r, a[3].y + r, r);
    context.arcTo(a[3].x - r, a[3].y + r, a[3].x + r, a[3].y + r, r);

    context.arcTo(a[4].x + r, a[4].y - r, a[4].x + r, a[4].y + r, r);
    context.arcTo(a[4].x + r, a[4].y + r, a[4].x - r, a[4].y + r, r);
    context.arcTo(a[4].x - r, a[4].y + r, a[4].x - r, a[4].y - r, r);

    context.arcTo(a[5].x + r, a[5].y - r, a[5].x - r, a[5].y - r, r);
    context.arcTo(a[5].x - r, a[5].y - r, a[5].x - r, a[5].y + r, r);

    context.arcTo(a[6].x + r, a[6].y + r, a[6].x - r, a[6].y + r, r);
    context.arcTo(a[6].x - r, a[6].y + r, a[6].x - r, a[6].y - r, r);
    context.arcTo(a[6].x - r, a[6].y - r, a[6].x + r, a[6].y - r, r);

    context.arcTo(a[7].x + r, a[7].y + r, a[7].x + r, a[7].y - r, r);
    context.arcTo(a[7].x + r, a[7].y - r, a[7].x - r, a[7].y - r, r);
  });

  const rings = [anchors[0], anchors[2], anchors[4], anchors[6]].map((anchor) =>
    createPath((context) => {
      context.arc(...anchor, r / 2, 0, 2 * PI);
    })
  );

  const inners = [anchors[0], anchors[2], anchors[4], anchors[6]].map(
    (anchor) =>
      createPath((context) => {
        context.arc(...anchor, r / 8, 0, 2 * PI);
      })
  );

  return [base, ...rings, ...inners];
}
