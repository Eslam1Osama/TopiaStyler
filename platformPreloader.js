// platformPreloader.js
(function() {
  // 1. Apply theme as early as possible
  const theme = localStorage.getItem('easoftopia-theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  // 2. Show preloader immediately (should already be in DOM)
  const preloader = document.getElementById('platform-preloader');

  // 3. Provide a global function to hide the preloader when the app is ready
  window.hidePlatformPreloader = function() {
    if (preloader) {
      preloader.classList.add('hide');
      setTimeout(() => preloader.remove(), 600); // Remove from DOM after fade
    }
  };

  // 4. Optionally, listen for theme changes in other tabs and update preloader color
  window.addEventListener('storage', function(event) {
    if (event.key === 'easoftopia-theme') {
      if (event.newValue === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  });
})(); 