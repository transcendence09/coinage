import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupGlobalAudioInit, playClick, playHover } from './audio.js';

// === Determine the coin slug from the file path ===
const pathParts = window.location.pathname.split('/');
const filename = pathParts[pathParts.length - 1]; // e.g., "1-penny.html"
const coinKey = filename.replace('.html', '');

// === Initialize audio on first user interaction ===
setupGlobalAudioInit();

// === Load model path from localStorage ===
const glbPath = localStorage.getItem('lastViewedGLB');
if (!glbPath) {
  alert('Coin model path is missing. Please return to the home page.');
  window.location.href = '../index.html';
  throw new Error('No GLB path found in localStorage');
}

// === Three.js Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('three-canvas'),
  alpha: true,
  antialias: true
});
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

// === Lock canvas height to prevent mobile scroll resizing issue ===
const initialHeight = document.documentElement.clientHeight;
renderer.setSize(window.innerWidth, initialHeight);
renderer.domElement.style.height = `${initialHeight}px`;

scene.add(new THREE.AmbientLight(0xffffff, 1));

// === Load Coin Model ===
const loader = new GLTFLoader();
let coin = null;
const clock = new THREE.Clock();

loader.load(
  glbPath,
  (gltf) => {
    coin = gltf.scene;

    const box = new THREE.Box3().setFromObject(coin);
    const size = new THREE.Vector3();
    box.getSize(size);
    const coinMaxDim = Math.max(size.x, size.y, size.z);

    const halfFovRadians = THREE.MathUtils.degToRad(camera.fov / 2);
    const visibleHeight = 2 * Math.tan(halfFovRadians) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    const screenMarginPx = 32;
    const marginWorldUnits = (screenMarginPx / window.innerWidth) * visibleWidth;
    const maxCoinWidthWorld = visibleWidth - marginWorldUnits;

    const scaleFactor = Math.min(2.5 / coinMaxDim, maxCoinWidthWorld / coinMaxDim);
    coin.scale.setScalar(scaleFactor);

    const center = new THREE.Vector3();
    box.getCenter(center);
    coin.position.sub(center);

    coin.position.y = -5;
    scene.add(coin);

    const targetY = 1.0;
    function animateCoinIn() {
      coin.position.y += (targetY - coin.position.y) * 0.1;
      if (Math.abs(coin.position.y - targetY) > 0.01) {
        requestAnimationFrame(animateCoinIn);
      } else {
        coin.position.y = targetY;
      }
    }

    animateCoinIn();
  },
  undefined,
  (err) => {
    console.error('Failed to load model:', err);
    alert('Failed to load coin model.');
  }
);

// === Prevent scroll-induced resize jump ===
let resizeTimeout;
window.addEventListener('resize', () => {
  if (Math.abs(window.innerHeight - initialHeight) < 100) return; // skip chrome scroll resize

  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const newHeight = document.documentElement.clientHeight;
    camera.aspect = window.innerWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, newHeight);
    renderer.domElement.style.height = `${newHeight}px`;
  }, 250);
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  if (coin) {
    const delta = clock.getDelta();
    coin.rotation.y -= 0.01 * delta * 60;
  }
  renderer.render(scene, camera);
}
animate();

// === Sidebar Menu Navigation + Sound ===
const basePath = `${window.location.origin}/coinage`;
document.querySelectorAll('#menu li').forEach(item => {
  const coinSlug = item.getAttribute('data-coin');
  let isActive = false;

  if (coinSlug && coinSlug.toLowerCase() === coinKey.toLowerCase()) {
    item.classList.add('active');
    item.setAttribute('disabled', 'true');
    isActive = true;
  }

  if (isActive === false) {
    item.addEventListener('mouseenter', playHover);

    item.addEventListener('click', () => {
      playClick();

      localStorage.setItem('lastViewedCoin', coinSlug);
      localStorage.setItem('lastViewedGLB', `${basePath}/models/${coinSlug}.glb`);
      setTimeout(() => {
        window.location.href = `${basePath}/coins/${coinSlug}.html`;
      }, 200);
    });
  }
});

// === Hamburger Toggle (Mobile Menu) ===
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');

if (hamburger && menu) {
  hamburger.addEventListener('click', () => {
    menu.classList.toggle('active');
  });
}

// === Close Button Behavior ===
const closeBtn = document.getElementById('closeButton');

closeBtn.addEventListener('mouseenter', playHover);

closeBtn.addEventListener('click', () => {
  playClick();
  setTimeout(() => {
    window.location.href = `${basePath}/index.html`;
  }, 200);
});

// === Scroll-to-Top Button Behavior ===
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
