// Ensure ThreeJS is in global scope for the 'examples/'
const Random = require('canvas-sketch-util/random');
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');

const settings = {
  // dimensions: [21.59, 13.97],
  dimensions: [800, 800],
  orientation: 'landscape',
  // pixelsPerInch: 300,
  scaleToView: true,
  animate: true,
  duration: 10,
  context: 'webgl',
  // units: 'cm',
  // prefix: '8.5x5.5-',
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor('#f2f2f2', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 200);
  camera.position.set(-15, 8, -15);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Debug helpers
  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);

  // const gridHelper = new THREE.GridHelper(50, 50);
  // scene.add(gridHelper);

  const ambLight = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambLight);

  const light1 = new THREE.SpotLight('#B8C7C4', 0.5);
  light1.position.set(8, 10, -8);
  light1.castShadow = true;
  //Set up shadow properties for the light
  light1.shadow.mapSize.width = 512 * 4; // default
  light1.shadow.mapSize.height = 512 * 4; // default
  light1.shadow.camera.near = 0.01; // default
  light1.shadow.camera.far = 200; // default
  scene.add(light1);
  scene.add(new THREE.PointLightHelper(light1, 0.5, '#444'));

  const light2 = new THREE.PointLight('#B8C7C4', 0.5);
  light2.position.set(8, 15, 1.3);
  light2.castShadow = true;
  //Set up shadow properties for the light
  light2.shadow.mapSize.width = 512 * 4; // default
  light2.shadow.mapSize.height = 512 * 4; // default
  light2.shadow.camera.near = 0.01; // default
  light2.shadow.camera.far = 200; // default
  scene.add(light2);
  scene.add(new THREE.PointLightHelper(light2, 0.75, '#444'));

  const planeGeometry = new THREE.PlaneBufferGeometry(25, 25, 32, 32);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: '0xfff',
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(Math.PI / 2);

  // plane.position.x = 0;
  plane.position.y = -1.1;
  // plane.position.z = 0;
  plane.receiveShadow = true;
  scene.add(plane);

  // Setup a material
  // MeshPhysicalMaterial
  // view-source:https://threejs.org/examples/webgl_materials_modified
  const material = new THREE.MeshStandardMaterial({
    color: '#FFB511',
    emissive: '#EE7F4B',
    metalness: 0,
    roughness: 1,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  let xOff = 0;

  const sculpture = new THREE.Group();

  const pyramids = [];

  // 11-36 in 26 steps, 28 for square
  for (let count = 11; count <= 36; count++) {
    const baseSize = 11 / count;

    for (let idx = 1; idx <= count; idx++) {
      const geometry = pyramidGeometry({
        s: baseSize,
        h: 2 * baseSize,
      });
      const pyramid = new THREE.Mesh(geometry, material);
      pyramid.castShadow = true;
      // pyramid.receiveShadow = true;

      pyramid.position.x = xOff;
      pyramid.position.z = idx * baseSize;
      pyramid.position.y = 0;

      sculpture.add(pyramid);
      pyramids.push(pyramid);
    }
    xOff += baseSize * 0.97;
  }

  const convergence = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    new THREE.MeshStandardMaterial({
      color: '#FF4C65',
      metalness: 0,
      roughness: 1,
      flatShading: true,
    }),
  );
  convergence.position.y = 1;

  sculpture.add(convergence);

  // Centre the sculpture
  new THREE.Box3()
    .setFromObject(sculpture)
    .getCenter(sculpture.position)
    .multiplyScalar(-1);

  scene.add(sculpture);

  convergence.translateX(-sculpture.position.x);
  convergence.translateZ(-sculpture.position.z);
  // convergence.translateY(1);
  const origin = convergence.position.clone();
  // const offset = sculpture.position.clone().multiplyScalar(0.5);

  distortPyramids(pyramids, convergence, origin);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      // turn on shadows in the renderer
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ playhead }) {
      controls.update();
      distortPyramids(pyramids, convergence, origin, playhead);
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);

/**
 * What is up with `pyramid.getWorldScale(origin)`? Just seems to change the dimensions
 * of the pyramid. But, why? Also, WTF is up with the bounding box giving the wrong
 * size (circular vs square base).
 *
 * Sharing geometry is better for performance.
 *  Can multiple pyramids use the same geometry but I animate them individually.
 *  Seems to not work. The movement ends up being exactly the same.
 *
 *  What if I animate with a shader? Would that work? Could I have one geometry but
 *  animate it differently for each instance.
 *
 *  Also, how do I combine an animation shader with material?
 *
 * ✅ How do shadows work?
 */

function pyramidGeometry({ s = 1, h = 2 }) {
  const geometry = new THREE.Geometry();

  geometry.vertices.push(
    new THREE.Vector3(0, h, 0),
    new THREE.Vector3(-s / 2, 0, -s / 2),
    new THREE.Vector3(s / 2, 0, -s / 2),
    new THREE.Vector3(s / 2, 0, s / 2),
    new THREE.Vector3(-s / 2, 0, s / 2),
  );

  geometry.faces.push(
    new THREE.Face3(0, 1, 2),
    new THREE.Face3(0, 2, 3),
    new THREE.Face3(0, 3, 4),
    new THREE.Face3(0, 4, 1),
    new THREE.Face3(1, 2, 3),
    new THREE.Face3(1, 3, 4),
  );

  geometry.add;

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

// let convergence = [5, 5];

function distortPyramids(pyramids, convergence, origin, playhead = 0) {
  const c = convergence.position;
  const t = Math.sin(playhead * 2 * Math.PI);

  const xOff = Random.noise2D(c.x / 100, t, 1, 0.5) * 2 * Math.PI;
  const zOff = Random.noise2D(c.z / 100, t + 0.5, 1, 0.5) * 2 * Math.PI;

  c.x = origin.x + 5 * Math.cos(xOff);
  c.z = origin.z + 5 * Math.sin(zOff);

  pyramids.forEach((pyramid) => {
    pyramid.geometry.vertices.forEach((vertex, idx) => {
      if (idx === 0) {
        const h = vecField(pyramid.position.x - c.x, pyramid.position.z - c.z);
        const theta = Math.atan2(h[1], h[0]);

        vertex.x = pyramid.geometry.radius * Math.cos(theta);
        vertex.z = pyramid.geometry.radius * Math.sin(theta);
      }
    });
    pyramid.geometry.verticesNeedUpdate = true;
  });
}
