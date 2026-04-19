// 1. Updated to detect the absolute end of the timer sequence
function schedulePages() {
  var cumlativeTime = 0;
  for (var p = 0; p < pageOrder.length; p++) {
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {
      var startTime = cumlativeTime;
      var duration = pageOrder[p].subpages[s].duration;
      var clearTime = cumlativeTime + duration;

      setTimeout(executePage, startTime, p, s);
      setTimeout(clearPage, clearTime, p, s);
      
      cumlativeTime = clearTime;
    }
  }
  // This is the safety net: 
  // 2 seconds after the VERY LAST subpage is scheduled to clear, run the restart.
  setTimeout(endSequence, cumlativeTime + 2000);
}

// 2. Simplified endSequence
function endSequence() {
  clearInfoBar();
  // clearInfoBar eventually triggers clearElements -> clearEnd -> silentRestart
}

// 3. The "Nuclear" Silent Restart
function silentRestart() {
  // Kill every single timeout currently running in the browser
  var highId = window.setTimeout(function() {}, 0);
  while (highId--) {
    window.clearTimeout(highId);
  }

  // Reset the basic counters
  currentLogoIndex = 0;
  currentLogo = undefined;

  // Force the page back to the "Ready" state by clearing the container's classes
  const mainElements = ['content-container', 'background-image', 'timeline-event-container'];
  mainElements.forEach(id => {
    let el = getElement(id);
    if (el) el.className = id; // This resets it to ONLY its base ID class, stripping everything else
  });

  // Re-hide subpages
  document.querySelectorAll('.subpage').forEach(el => {
    el.style.top = '1080px';
    el.style.visibility = 'hidden';
  });

  console.log("Looping... Fetching new weather data.");

  // Restart the process
  if (typeof fetchCurrentWeather === 'function') {
    fetchCurrentWeather();
  } else {
    scheduleTimeline();
  }
}
