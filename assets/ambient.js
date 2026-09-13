(() => {
  const scene = document.querySelector('.spectral-scene');
  if (!scene) return;
  const updatePlayback = () => scene.classList.toggle('is-paused', document.hidden);
  document.addEventListener('visibilitychange', updatePlayback);
  updatePlayback();
})();
