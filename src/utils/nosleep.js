let wakeLock = null;
let wakeLockVisibilityHandler = null;

export async function startNoSleep() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock acquired');
      
      // Handle visibility changes to re-acquire wake lock if the app comes back to foreground
      if (!wakeLockVisibilityHandler) {
        wakeLockVisibilityHandler = async () => {
          if (wakeLock !== null && document.visibilityState === 'visible') {
            try {
              wakeLock = await navigator.wakeLock.request('screen');
              console.log('Wake Lock re-acquired on visibility change');
            } catch (err) {
               console.warn(`Wake Lock re-acquire failed: ${err.message}`);
            }
          }
        };
        document.addEventListener('visibilitychange', wakeLockVisibilityHandler);
      }
    } catch (err) {
      console.warn(`Wake Lock failed: ${err.name}, ${err.message}`);
    }
  } else {
    console.warn('Wake Lock API not supported in this browser.');
  }
}

export function stopNoSleep() {
  if (wakeLock !== null) {
    wakeLock.release().then(() => {
      wakeLock = null;
      console.log('Wake Lock released');
    });
  }
  
  if (wakeLockVisibilityHandler) {
    document.removeEventListener('visibilitychange', wakeLockVisibilityHandler);
    wakeLockVisibilityHandler = null;
  }
}
