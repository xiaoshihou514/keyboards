const fullscreenLinks = document.querySelectorAll('[data-fullscreen]');

for (const link of fullscreenLinks) {
  link.addEventListener('click', async event => {
    const card = link.closest('.keyboard-card');
    const frame = card?.querySelector('.preview-frame');
    if (!frame) return;

    const requestFullscreen = frame.requestFullscreen || frame.webkitRequestFullscreen;
    if (!requestFullscreen) return;

    event.preventDefault();
    try {
      await requestFullscreen.call(frame);
    } catch {
      window.open(link.href, '_blank', 'noopener');
    }
  });
}
