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
  duration: 5,
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
  camera.position.set(-40, 40, -40);
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

  const light1 = new THREE.SpotLight('#B8C7C4', 0.5);
  light1.position.set(-20, 10, 0);
  light1.castShadow = true;
  scene.add(light1);
  // scene.add(new THREE.SpotLightHelper(light1, 0.5));

  const light2 = new THREE.SpotLight('#B8C7C4', 0.5);
  light2.position.set(10, 20, 0);
  light2.castShadow = true;
  scene.add(light2);
  // scene.add(new THREE.SpotLightHelper(light2, 0.5));

  // // Setup a geometry
  // const geometry = new THREE.ConeGeometry(1, 2, 4, 1);
  // geometry.rotateY(Math.PI / 4);

  // Setup a material
  const material = new THREE.MeshPhysicalMaterial({
    map: null,
    color: '#FFB511',
    emissive: '#EE7F4B',
    metalness: 0,
    roughness: 1,
    clearcoat: 1,
    clearcoatRoughness: 1,
    reflectivity: 1,
  });

  let xOff = 0;

  const sculpture = new THREE.Group();
  const origin = new THREE.Vector3();

  const pyramids = [];

  // 11-36 in 26 steps
  for (let count = 11; count <= 28; count++) {
    const d = 36 / count;

    for (let idx = 1; idx <= count; idx++) {
      const geometry = new THREE.ConeGeometry(1, 2, 4, 1);
      geometry.rotateY(Math.PI / 4);

      const pyramid = new THREE.Mesh(geometry, material);
      pyramid.castShadow = true;
      pyramid.receiveShadow = true;
      pyramid.scale.setScalar(d);

      pyramid.geometry.computeBoundingBox();
      const size = pyramid.geometry.boundingBox.getSize(origin);
      pyramid.getWorldScale(origin);

      pyramid.position.x = xOff;
      // The object size is for a circular base but we want a square base
      pyramid.position.z = (size.z * 2 * idx) / 2 ** 0.5;
      pyramid.position.y = size.y;

      sculpture.add(pyramid);
      pyramids.push(pyramid);

      if (idx === count) {
        xOff += (size.x * 1.94) / 2 ** 0.5;
      }
    }
  }

  sculpture.scale.setScalar(0.5);

  // Centre the sculpture
  new THREE.Box3()
    .setFromObject(sculpture)
    .getCenter(sculpture.position)
    .multiplyScalar(-1);

  scene.add(sculpture);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ playhead }) {
      controls.update();
      const l = pyramids.length;

      // pyramids.forEach((pyramid, pix) => {
      //   pyramid.geometry.vertices.forEach((vertex, idx) => {
      //     if (idx === 0) {
      //       const theta =
      //         Random.noise3D(
      //           vertex.x / 1000,
      //           vertex.y / 1000,
      //           (0.5 * (pix + 1) * Math.sin(playhead * 4 * Math.PI)) / l,
      //           // ((pix + 1) * time) / l,
      //         ) *
      //         2 *
      //         Math.PI;

      //       vertex.x = 1 * Math.sin(theta);
      //       vertex.z = 1 * Math.cos(theta);
      //     }
      //   });
      //   pyramid.geometry.verticesNeedUpdate = true;
      // });

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
 * How do shadows work?
 */

function pyramidGeometry({ s = 1, h = 2 }) {
  const geometry = new THREE.Geometry();

  geometry.vertices.push(
    new THREE.Vector3(s / 2, h, s / 2),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, s),
    new THREE.Vector3(s, 0, s),
    new THREE.Vector3(s, 0, 0),
  );

  geometry.faces.push(
    new THREE.Face3(0, 1, 2),
    new THREE.Face3(0, 2, 3),
    new THREE.Face3(0, 3, 4),
    new THREE.Face3(0, 4, 1),
    new THREE.Face3(1, 3, 2),
    new THREE.Face3(1, 4, 3),
  );

  geometry.computeVertexNormals();

  return geometry;
}