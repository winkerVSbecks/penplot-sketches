const canvasSketch = require('canvas-sketch');
const { mapRange, lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: 'a3',
  orientation: 'portrait',
  scaleToView: true,
  prefix: 'a3',
  pixelsPerInch: 300,
  units: 'cm',
  // dimensions: [640, 640],
  // animate: true,
  // duration: 3,
};

const shapes = {
  0: (context, x, y, s) => {
    const r = s / 16;
    context.beginPath();
    context.arc(x + r, y + r, r, 0, Math.PI * 2);
    context.strokeStyle = 'black';
    context.stroke();
    context.closePath();
  },
  // 1: (context, x, y, s) => {
  //   context.beginPath();
  //   context.arc(x, y, s / 4, 0, Math.PI * 2);
  // },
};

canvasSketch(({ width, height }) => {
  const SUM_THRESHOLD = 1;
  const NUM_CIRCLES = 12;
  const RESOLUTION = 128;
  const scale = v => {
    const index = Math.min(Math.floor(v), 9);

    // return shapes[index] ? shapes[index] : () => {};

    // return ['', '.', '◦', '○', '◇', '◆', '✲', '✺', '✺', '✺', '✺'][index];
    return ['.', '✼', '✼', '✼', '✼', '✼', '✼', '✼', '✼', '✼'][index];
    // return ['.', 1, 2, 3, 4, 5, 6, 7, 8, 9][index];
    return v > 0 ? 1 : 0;
  };

  let circles = new Array(NUM_CIRCLES).fill(0).map(() => ({
    x: Random.range(0, width),
    y: Random.range(0, height),
    r: Random.range(width * 0.0625, width * 0.125),
    vx: Random.range(-width * 0.01, width * 0.01),
    vy: Random.range(-width * 0.01, width * 0.01),
  }));

  return ({ context, width, height }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    moveCircle(circles, width, height);

    for (let x = 0; x < RESOLUTION; x++) {
      context.beginPath();
      context.strokeStyle = 'black';
      context.lineWidth = width / RESOLUTION / 8;
      for (let y = 0; y < RESOLUTION; y++) {
        const u = x / (RESOLUTION - 1);
        const v = y / (RESOLUTION - 1);

        const size = width / RESOLUTION;

        const t = {
          x: lerp(0, width, u),
          y: lerp(0, height, v),
        };

        const sum = circles.reduce((sum, c) => {
          const dx = t.x - c.x;
          const dy = t.y - c.y;
          const d2 = dx * dx + dy * dy;
          return sum + (c.r * c.r) / d2;
        }, 0);

        if (sum > SUM_THRESHOLD) {
          context.lineTo(t.x, t.y);
        } else {
          context.moveTo(t.x, t.y);

          // context.save();
          // // scale(sum)(context, t.x, t.y, size);
          // context.font = `${size}px monospace`;
          // context.fillStyle = 'black';
          // context.textAlign = 'center';
          // context.fillText(scale(sum), t.x, t.y - size / 2);
          // context.restore();
        }
      }
      context.stroke();
    }
  };
}, settings);

function moveCircle(circles, width, height) {
  circles.forEach(c => {
    c.x += c.vx;
    c.y += c.vy;

    if (c.x - c.r < 0) {
      c.vx = +Math.abs(c.vx);
    }
    if (c.x + c.r > width) {
      c.vx = -Math.abs(c.vx);
    }
    if (c.y - c.r < 0) {
      c.vy = +Math.abs(c.vy);
    }
    if (c.y + c.r > height) {
      c.vy = -Math.abs(c.vy);
    }
  });
}
