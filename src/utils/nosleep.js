let noSleepAudio = null;

export function initNoSleep() {
  if (noSleepAudio) return;
  // Create a silent audio element to keep the WebView alive when the screen sleeps
  noSleepAudio = new Audio();
  // 1-second completely silent RIFF WAVE Base64
  noSleepAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  noSleepAudio.loop = true;
  // Preload forces the browser to engage the media framework instantly
  noSleepAudio.preload = 'auto';
}

export function startNoSleep() {
  if (!noSleepAudio) initNoSleep();
  
  // Browsers require a gesture to trigger .play(). 
  // Clicking "Start Event" counts as a gesture.
  noSleepAudio.play().catch(e => {
    console.warn("NoSleep silent audio failed to securely lock background execution:", e);
  });
}

export function stopNoSleep() {
  if (noSleepAudio) {
    noSleepAudio.pause();
    noSleepAudio.currentTime = 0;
  }
}
