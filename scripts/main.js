import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setupGlobalAudioInit, playClick, playHover } from './audio.js';

// === Init audio system ===
setupGlobalAudioInit();

const basePath = `${window.location.origin}/coin-project`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 16;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: document.getElementById('three-canvas') });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

let fixedHeight = window.innerHeight;
renderer.setSize(window.innerWidth, fixedHeight);
renderer.domElement.style.height = `${fixedHeight}px`;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
controls.rotateSpeed = 0.25;

let isUserInteracting = false;
controls.addEventListener('start', () => isUserInteracting = true);
controls.addEventListener('end', () => isUserInteracting = false);

scene.add(new THREE.AmbientLight(0xffffff, 1));

// === Tooltip ===
const popup = document.getElementById('popup');

// === Raycasting ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED = null;

// === Coin Models ===
const coinPaths = [
  `${basePath}/models/1-penny.glb`,
  `${basePath}/models/1-pound.glb`,
  `${basePath}/models/2-pence.glb`,
  `${basePath}/models/2-pounds.glb`,
  `${basePath}/models/50-pence.glb`
];

const coinInfo = [
  '1 Penny',
  '1 Pound',
  '2 Pence',
  '2 Pounds',
  '50 Pence'
];

const coinGroup = new THREE.Group();
const coinMeshes = [];
scene.add(coinGroup);

const radius = 8;
const clock = new THREE.Clock();

coinPaths.forEach((path, i) => {
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    const coin = gltf.scene;
    const box = new THREE.Box3().setFromObject(coin);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scaleFactor = 5 / Math.max(size.x, size.y, size.z);
    coin.scale.setScalar(scaleFactor);

    const center = new THREE.Vector3();
    box.getCenter(center);
    coin.position.sub(center);

    const angle = (i / coinPaths.length) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    coin.position.set(x, 0, z);
    coin.lookAt(0, 0, 0);

    coin.userData.label = coinInfo[i];
    coin.userData.spinX = (Math.random() * 0.01) + 0.0025;
    coin.userData.spinY = (Math.random() * 0.01) + 0.0025;
    coin.userData.spinZ = (Math.random() * 0.01) + 0.0025;
    coin.userData.bobOffset = Math.random() * Math.PI * 2;
    coin.userData.bobAmplitude = 0.2 + Math.random() * 0.1;
    coin.userData.flyOut = false;

    coinGroup.add(coin);
    coinMeshes.push(coin);

    const lastViewed = localStorage.getItem('lastViewedCoin');
    if (lastViewed && lastViewed === coin.userData.label.replace(' ', '-').toLowerCase()) {
      const focusAngle = (i / coinPaths.length) * Math.PI * 2;
      coinGroup.rotation.y = -focusAngle;
      localStorage.removeItem('lastViewedCoin');
    }
  });
});

// === Resize ===
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    fixedHeight = window.innerHeight;
    camera.aspect = window.innerWidth / fixedHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, fixedHeight);
    renderer.domElement.style.height = `${fixedHeight}px`;
  }, 250);
});

// === Mouse Position for Raycasting ===
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// === Coin Click ===
window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(coinMeshes, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target.parent && !coinMeshes.includes(target)) {
      target = target.parent;
    }

    if (coinMeshes.includes(target)) {
      playClick();

      const label = target.userData.label;
      const coinSlug = label.replace(' ', '-').toLowerCase();
      const startY = target.position.y;
      const endY = startY + 10;
      const startRotation = target.rotation.y;
      const duration = 500;
      const startTime = performance.now();

      function animateUp(time) {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        target.userData.flyOut = true;
        target.position.y = startY + (endY - startY) * t;
        target.rotation.y = startRotation + Math.PI * 1.2 * t;

        if (t < 1) {
          requestAnimationFrame(animateUp);
        } else {
          localStorage.setItem('lastViewedCoin', coinSlug);
          localStorage.setItem('lastViewedGLB', `${basePath}/models/${coinSlug}.glb`);
          window.location.href = `${basePath}/coins/${coinSlug}.html`;
        }
      }

      requestAnimationFrame(animateUp);
    }
  }
});

// === Menu Navigation with Sound ===
document.querySelectorAll('#menu li').forEach(item => {
  item.addEventListener('mouseenter', playHover);

  item.addEventListener('click', () => {
    playClick();
    const coinSlug = item.getAttribute('data-coin');
    localStorage.setItem('lastViewedCoin', coinSlug);
    localStorage.setItem('lastViewedGLB', `${basePath}/models/${coinSlug}.glb`);
    window.location.href = `${basePath}/coins/${coinSlug}.html`;
  });
});

// === Hamburger Menu Toggle ===
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');

if (hamburger && menu) {
  hamburger.addEventListener('click', () => {
    menu.classList.toggle('active');
  });
}

// === Touch Support ===
let startX = 0;
window.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const deltaX = e.touches[0].clientX - startX;
  coinGroup.rotation.y += deltaX * 0.005;
  startX = e.touches[0].clientX;
  isUserInteracting = true;
}, { passive: true });

window.addEventListener('touchend', () => {
  isUserInteracting = false;
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update();

  if (!isUserInteracting) {
    coinGroup.rotation.y += 0.0025;
  }

  coinMeshes.forEach((coin) => {
    coin.rotation.y += coin.userData.spinY * delta * 60;
    coin.rotation.x += coin.userData.spinX * delta * 60;
    coin.rotation.z += coin.userData.spinZ * delta * 60;

    if (!coin.userData.flyOut) {
      const time = clock.elapsedTime;
      const bob = Math.sin(time * 2 + coin.userData.bobOffset) * coin.userData.bobAmplitude;
      coin.position.y = bob;
    }
  });

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(coinMeshes, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target.parent && !coinMeshes.includes(target)) {
      target = target.parent;
    }

    if (INTERSECTED !== target) {
      INTERSECTED = target;
      playHover();
      document.body.style.cursor = 'pointer';
    }

    const worldPosition = new THREE.Vector3();
    INTERSECTED.getWorldPosition(worldPosition);
    const screenPos = worldPosition.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.525) * fixedHeight;

    if (popup) {
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
      popup.innerText = INTERSECTED.userData.label || 'Coin';
      popup.classList.add('visible');
    }
  } else {
    if (INTERSECTED) {
      INTERSECTED = null;
      document.body.style.cursor = 'default';
      if (popup) popup.classList.remove('visible');
    }
  }

  renderer.render(scene, camera);
}

animate();
