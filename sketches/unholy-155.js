// Ensure ThreeJS is in global scope for the 'examples/'
const Random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/Color');
const risoColors = require('riso-colors').map((h) => h.hex);
const paperColors = require('paper-colors').map((h) => h.hex);
const { MeshLine, MeshLineMaterial } = require('three.meshline');
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');

const settings = {
  // dimensions: [21.59, 13.97],
  dimensions: [1600, 1600],
  orientation: 'landscape',
  // pixelsPerInch: 300,
  scaleToView: true,
  animate: true,
  duration: 10,
  context: 'webgl',
  // units: 'cm',
  // prefix: '8.5x5.5-',
};

const sketch = ({ context, width, height }) => {
  const background = Random.pick(paperColors);
  const minContrast = 3;
  const inkColors = risoColors.filter(
    (color) => Color.contrastRatio(background, color) >= minContrast,
  );
  const foreground = Random.pick(inkColors);

  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor(background, 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 200);
  camera.position.set(15, 8, 15);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(background, 0.05);

  // Debug helpers
  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);

  const ambLight = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambLight);

  let xOff = 0;

  const sculpture = new THREE.Group();

  const pyramids = [];

  // 11-36 in 26 steps, 28 for square
  for (let count = 11; count <= 28; count++) {
    const baseSize = 11 / count;

    for (let idx = 0; idx < count; idx++) {
      const geometry = pyramidGeometry({
        s: baseSize,
        h: 2 * baseSize,
      });

      const pyramid = makeMesh(geometry, background, foreground);

      pyramid.position.x = xOff;
      pyramid.position.z = idx * baseSize;
      pyramid.position.y = 0;

      sculpture.add(pyramid);
      pyramids.push(pyramid);
    }
    xOff += baseSize;
  }

  const convergence = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    new THREE.MeshStandardMaterial({
      color: '#FF4C65',
      visible: false,
    }),
  );
  convergence.position.y = 1;

  sculpture.add(convergence);

  sculpture.scale.setScalar(1.2);

  // Centre the sculpture
  const sculptureSize = new THREE.Box3().setFromObject(sculpture);
  sculptureSize.getCenter(sculpture.position).multiplyScalar(-1);

  scene.add(sculpture);

  sculpture.position.y = -0.9;

  const planeGeometry = new THREE.BoxGeometry(
    Math.abs(sculptureSize.max.x - sculptureSize.min.x),
    Math.abs(sculptureSize.max.z - sculptureSize.min.z),
    0.5,
    1,
    1,
  );
  const plane = makeMesh2(planeGeometry, foreground, background); // new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(Math.PI / 2);
  plane.position.x = -sculptureSize.min.x / 2;
  plane.position.z = -sculptureSize.min.z / 2;
  plane.position.y = -0.75;
  scene.add(plane);

  convergence.translateX(-sculpture.position.x);
  convergence.translateZ(-sculpture.position.z);
  const origin = convergence.position.clone();

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ playhead }) {
      controls.update();
      distortPyramids(pyramids, convergence, origin, playhead);
      renderer.render(scene, camera);
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);

function pyramidGeometry({ s = 1, h = 2 }) {
  const geometry = new THREE.Geometry();

  geometry.vertices.push(
    new THREE.Vector3(s / 2, h, s / 2),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(s, 0, 0),
    new THREE.Vector3(s, 0, s),
    new THREE.Vector3(0, 0, s),
  );

  geometry.faces.push(
    new THREE.Face3(2, 1, 0),
    new THREE.Face3(3, 2, 0),
    new THREE.Face3(4, 3, 0),
    new THREE.Face3(1, 4, 0),
    new THREE.Face3(1, 2, 3),
    new THREE.Face3(1, 3, 4),
  );

  geometry.computeVertexNormals();

  geometry.radius = (s * 2 ** 0.5) / 2;

  return geometry;
}

function vecField(x, y) {
  return [y - x, -x - y];
  const l = Math.hypot(x, y) ** 0.5;
  const f = Math.sin(2 * x + 2 * y);
  const r = (x ** 2 + y ** 2) / (2 * x);

  // return [x, Math.sin(mapRange(x, 0, width, 0, 3 * Math.PI)) * y];
  // return [y, x ** 2 + y ** 2 * x - 3 * y];
  // return [x - y - x * (x ** 2 + y ** 2), x + y - y * (x ** 2 + y ** 2)];
  // return [x + 2 * y, 3 * x];
  // return [Math.cos(x) * y, Math.sin(x) * y];
  // return [x, (y ** 2 - x ** 2) / (2 * x * y)];
  // return [Math.cos(f), Math.sin(f)];
  // return [Math.sin(y), Math.sin(x)];
  // return [-y, x];
  return [Math.exp(y), y];
  return [x, l];
  return [x / x, y + Math.sin(y)];
  return [y, Math.cos(Math.log(l * Math.min(Math.cos(l))))];
  return [Math.tan(y - x), Math.tan(-x - y)];
}

function distortPyramids(pyramids, convergence, origin, playhead = 0) {
  const c = convergence.position;
  const t = Math.sin(playhead * 2 * Math.PI);

  const xOff = Random.noise2D(c.x / 100, t, 1, 0.5) * 2 * Math.PI;
  const zOff = Random.noise2D(c.z / 100, t + 0.5, 1, 0.5) * 2 * Math.PI;

  c.x = origin.x + 5 * Math.cos(xOff);
  c.z = origin.z + 5 * Math.sin(zOff);

  pyramids.forEach((pyramid) => {
    let vertices = [];
    const h = vecField(pyramid.position.x - c.x, pyramid.position.z - c.z);
    const theta = Math.atan2(h[1], h[0]);
    let newPosition;

    pyramid.geometry.vertices.forEach((vertex, idx) => {
      if (idx === 0) {
        vertex.x = pyramid.geometry.radius * Math.cos(theta);
        vertex.z = pyramid.geometry.radius * Math.sin(theta);
        newPosition = vertex.clone();
      }
      vertices.push(vertex.x, vertex.y, vertex.z);
    });

    pyramid.children.forEach((child, idx) => {
      if (idx > 0) {
        const line = child.line;

        var positions = line.attributes.position.array;
        var l = positions.length;

        positions[l - 6] = newPosition.x;
        positions[l - 5] = newPosition.y;
        positions[l - 4] = newPosition.z;
        positions[l - 3] = newPosition.x;
        positions[l - 2] = newPosition.y;
        positions[l - 1] = newPosition.z;

        line.attributes.position.needsUpdate = true;
      }
    });

    pyramid.geometry.verticesNeedUpdate = true;
  });
}

function makeMesh(geometry, fill = background, stroke) {
  const solidMaterial = new THREE.MeshBasicMaterial({
    color: fill,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, solidMaterial);

  const strokeMaterial = new MeshLineMaterial({
    color: stroke,
    lineWidth: 0.06,
    // opacity: 0.5,
    // transparent: true,
    sizeAttenuation: 1,
  });

  linesFrom(geometry, strokeMaterial).forEach((wireframe) => {
    mesh.add(wireframe);
  });

  return mesh;
}

function makeMesh2(geometry, fill = background, stroke) {
  const solidMaterial = new THREE.MeshBasicMaterial({
    color: fill,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, solidMaterial);

  const wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: stroke,
    linewidth: 2,
    side: THREE.DoubleSide,
  });
  const wireframe = new THREE.LineSegments(
    wireframeGeometry,
    wireframeMaterial,
  );
  mesh.add(wireframe);

  return mesh;
}

function linesFrom(geometry, material) {
  const vertices = geometry.vertices;

  const lines = [
    [1, 2, 3, 4].map((i) => vertices[i]),
    [1, 0].map((i) => vertices[i]),
    [2, 0].map((i) => vertices[i]),
    [3, 0].map((i) => vertices[i]),
    [4, 0].map((i) => vertices[i]),
  ];

  const wireframes = lines.map((pts) => {
    const line = new MeshLine();

    const lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(...pts);
    line.setGeometry(lineGeometry, (p) => Math.max(1 - p, 0.1));

    const wireframe = new THREE.Mesh(line.geometry, material);
    wireframe.line = line;

    return wireframe;
  });

  return wireframes;
}
