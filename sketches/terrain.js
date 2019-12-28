const canvasSketch = require('canvas-sketch');
const {
  renderPaths,
  createPath,
  pathsToPolylines,
} = require('canvas-sketch-util/penplot');
const { mapRange } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

const defaultSeed = 'terrain';

// Set a random seed so we can reproduce this print later
random.setSeed(defaultSeed || random.getRandomSeed());
console.log('Random Seed:', random.getSeed());

class Noise {
  static lerp(t, a, b) {
    return a + t * (b - a);
  }
  static grad2d(i, x, y) {
    const v = (i & 1) === 0 ? x : y;
    return (i & 2) === 0 ? -v : v;
  }
  constructor(octaves = 1) {
    this.p = new Uint8Array(512);
    this.octaves = octaves;
    this.init();
  }
  init() {
    for (let i = 0; i < 512; ++i) {
      this.p[i] = Math.random() * 256;
    }
  }
  noise2d(x2d, y2d) {
    const X = Math.floor(x2d) & 255;
    const Y = Math.floor(y2d) & 255;
    const x = x2d - Math.floor(x2d);
    const y = y2d - Math.floor(y2d);
    const fx = (3 - 2 * x) * x * x;
    const fy = (3 - 2 * y) * y * y;
    const p0 = this.p[X] + Y;
    const p1 = this.p[X + 1] + Y;
    return Noise.lerp(
      fy,
      Noise.lerp(
        fx,
        Noise.grad2d(this.p[p0], x, y),
        Noise.grad2d(this.p[p1], x - 1, y),
      ),
      Noise.lerp(
        fx,
        Noise.grad2d(this.p[p0 + 1], x, y - 1),
        Noise.grad2d(this.p[p1 + 1], x - 1, y - 1),
      ),
    );
  }
  noise(x, y) {
    let e = 1,
      k = 1,
      s = 0;
    for (let i = 0; i < this.octaves; ++i) {
      e *= 0.5;
      s += (e * (1 + this.noise2d(k * x, k * y))) / 2;
      k *= 2;
    }
    return s;
  }
}

const settings = {
  suffix: random.getSeed(),
  dimensions: 'A4',
  // dimensions: [800, 800],
  orientation: 'portrait',
  // pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const perlin = new Noise(10);

const sketch = props => {
  const { width, height, units } = props;

  let iterations = 1000 / 4;
  const numSets = 5;
  const numParticles = 4000 / 4;
  const perlinSeedX = random.rangeFloor(0, width);
  const perlinSeedY = random.rangeFloor(0, height);

  const particlesSets = new Array(numSets).fill(0).map(() => {
    return new Array(numParticles).fill(0).map(() => ({
      pos: {
        x: random.range(0, width), //random.gaussian(width / 2, width * 0.125),
        y: random.range(0, height), //random.gaussian(height / 2, height * 0.125),
      },
      angle: random.range(0, 2 * Math.PI),
      val: 0,
      path: createPath(),
    }));
  });

  while (iterations-- > 0) {
    particlesSets.forEach((particles, index) => {
      particles.forEach(particle => {
        update(particle, index);
        display(particle, index);
      });
    });
  }

  let lines = [];

  particlesSets.forEach(particles => {
    particles.forEach(particle => {
      lines.push(particle.path);
    });
  });

  return props =>
    renderPaths(pathsToPolylines(lines, { units }), {
      ...props,
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 0.005,
      // foreground: 'rgba(0,0,0,0.25)',
      // optimize: true,
    });

  function scale(n, s) {
    return (s - n / s) * 2 - 1;
  }

  function update(particle, index) {
    particle.pos.x += Math.cos(particle.angle);
    particle.pos.y += Math.sin(particle.angle);

    const nx = 1.8 * scale(particle.pos.x, width);
    const ny = 1.8 * scale(particle.pos.y, height);

    const n = { x: nx, y: ny };

    const nval =
      (perlin.noise(n.x + perlinSeedX, n.y - perlinSeedY) +
        0.045 * (index - numSets / 2)) %
      1;

    particle.angle += 3 * (nval * 2 - 1);
    particle.val = nval;
  }

  function display(particle, bottomEnd = 0.48, topEnd = 0.5) {
    if (particle.val > bottomEnd && particle.val < topEnd) {
      // particle.path.push([particle.pos.x, particle.pos.y]);
      particle.path.rect(particle.pos.x, particle.pos.y, 1, 1);
    }
  }
};

canvasSketch(sketch, settings);
