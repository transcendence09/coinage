const basePath = `${window.location.origin}/coin-project`;

let clickSound, hoverSound;
let audioInitialized = false;

function createAudioElements() {
  clickSound = new Audio(`${basePath}/sounds/click.m4a`);
  hoverSound = new Audio(`${basePath}/sounds/tick.m4a`);
  clickSound.volume = 0.5;
  hoverSound.volume = 0.3;
}

function initializeAudioOnce() {
  if (!audioInitialized) {
    createAudioElements();
    clickSound.volume = 0;
    hoverSound.volume = 0;
    clickSound.play().then(() => clickSound.pause()).catch(() => {});
    hoverSound.play().then(() => hoverSound.pause()).catch(() => {});
    setTimeout(() => {
      clickSound.volume = 0.5;
      hoverSound.volume = 0.3;
    }, 100);
    audioInitialized = true;
  }
}

function setupGlobalAudioInit() {
  ['click', 'mousemove', 'touchstart', 'keydown'].forEach(event => {
    window.addEventListener(event, initializeAudioOnce, { once: true });
  });
}

function playClick() {
  if (clickSound && audioInitialized) {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
}

function playHover() {
  if (hoverSound && audioInitialized) {
    hoverSound.currentTime = 0;
    hoverSound.play().catch(() => {});
  }
}

export {
  setupGlobalAudioInit,
  playClick,
  playHover
};
