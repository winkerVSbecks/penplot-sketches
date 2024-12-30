const { createPath } = require('canvas-sketch-util/penplot');

const PI = Math.PI;

// skip: t, b, l, r, tl, tr, bl, br

export function drawClixo(x, y, r, skip = []) {
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

  function hasSkips(skip, ...items) {
    return items.some((item) => skip.includes(item));
  }

  const base = createPath((context) => {
    if (hasSkips(skip, 'tl', 'l', 't')) {
      context.moveTo(x + r, y);
    } else {
      context.moveTo(x, y + r);
      context.arcTo(x - r, y + r, x - r, y - r, r);
      context.arcTo(x - r, y - r, x + r, y - r, r);
      context.arcTo(x + r, y - r, x + r, y + r, r);
    }

    context.arcTo(a[1].x - r, a[1].y + r, a[1].x + r, a[1].y + r, r);
    context.arcTo(a[1].x + r, a[1].y + r, a[1].x + r, a[1].y - r, r);

    if (hasSkips(skip, 'tr', 'r', 't')) {
      context.moveTo(a[2].x, a[2].y + r);
    } else {
      context.arcTo(a[2].x - r, a[2].y - r, a[2].x + r, a[2].y - r, r);
      context.arcTo(a[2].x + r, a[2].y - r, a[2].x + r, a[2].y + r, r);
      context.arcTo(a[2].x + r, a[2].y + r, a[2].x - r, a[2].y + r, r);
    }

    context.arcTo(a[3].x - r, a[3].y - r, a[3].x - r, a[3].y + r, r);
    context.arcTo(a[3].x - r, a[3].y + r, a[3].x + r, a[3].y + r, r);

    if (hasSkips(skip, 'br', 'r', 'b')) {
      context.moveTo(a[4].x - r, a[4].y);
    } else {
      context.arcTo(a[4].x + r, a[4].y - r, a[4].x + r, a[4].y + r, r);
      context.arcTo(a[4].x + r, a[4].y + r, a[4].x - r, a[4].y + r, r);
      context.arcTo(a[4].x - r, a[4].y + r, a[4].x - r, a[4].y - r, r);
    }

    context.arcTo(a[5].x + r, a[5].y - r, a[5].x - r, a[5].y - r, r);
    context.arcTo(a[5].x - r, a[5].y - r, a[5].x - r, a[5].y + r, r);

    if (hasSkips(skip, 'bl', 'l', 'b')) {
      context.moveTo(a[6].x, a[6].y - r);
    } else {
      context.arcTo(a[6].x + r, a[6].y + r, a[6].x - r, a[6].y + r, r);
      context.arcTo(a[6].x - r, a[6].y + r, a[6].x - r, a[6].y - r, r);
      context.arcTo(a[6].x - r, a[6].y - r, a[6].x + r, a[6].y - r, r);
    }

    context.arcTo(a[7].x + r, a[7].y + r, a[7].x + r, a[7].y - r, r);
    context.arcTo(a[7].x + r, a[7].y - r, a[7].x - r, a[7].y - r, r);
  });

  const joints = [
    ...(hasSkips(skip, 'tl', 'l', 't') ? [] : [anchors[0]]),
    ...(hasSkips(skip, 'tr', 'r', 't') ? [] : [anchors[2]]),
    ...(hasSkips(skip, 'br', 'r', 'b') ? [] : [anchors[4]]),
    ...(hasSkips(skip, 'bl', 'l', 'b') ? [] : [anchors[6]]),
  ];

  const rings = joints.map((anchor) =>
    createPath((context) => {
      context.arc(...anchor, r / 2, 0, 2 * PI);
    })
  );

  const inners = joints.map((anchor) =>
    createPath((context) => {
      context.arc(...anchor, r / 8, 0, 2 * PI);
    })
  );

  return [base, ...rings, ...inners];
}
