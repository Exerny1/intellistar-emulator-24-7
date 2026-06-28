// Timings: Weather 17s, Greeting 6s
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Today", subpages: [{name: "today-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]}]
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "tomorrow-night-page", duration: 17000}, {name: "7day-page", duration: 17000}]}]
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]}]
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]}]

const WEEKDAY = ["SUN","MON","TUES","WED","THU","FRI","SAT"];

const jingle = new Audio("assets/music/jingle.wav")
const crawlSpeedCasual = 10;
const crawlSpeedFast = 20;
const crawlScreenTime = 45;
const crawlSpace = 70;

var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;

// =======================
// INIT
// =======================
window.onload = function () {
  CONFIG.addLocationOption('airport-code', 'Airport', 'ATL or KATL')
  CONFIG.addLocationOption('zip-code', 'Postal', '00000')
  CONFIG.addOption('crawlText', 'Crawl Text', 'Text that scrolls along the bottom')
  CONFIG.addOption('greetingText', 'Greeting Text', 'Message (or joke) that appears at the start')
  CONFIG.load();

  preLoadMusic();
  setMainBackground();
  resizeWindow();
  setClockTime();

  if (!CONFIG.loop) {
    getElement("settings-container").style.display = 'block';
    guessZipCode();
  } else {
    if (typeof fetchCurrentWeather === 'function') fetchCurrentWeather();
  }
}

// =======================
// CORE FLOW (UNCHANGED)
// =======================
function preLoadMusic(){
  var index = Math.floor(Math.random() * 12) + 1;
  music = new Audio("assets/music/" + index + ".wav");
}

function scheduleTimeline(){
  var hour = new Date().getHours();
  isDay = (hour >= 6 && hour < 18);

  if(typeof alerts !== 'undefined' && alerts.length == 1) pageOrder = SINGLE;
  else if(typeof alerts !== 'undefined' && alerts.length > 1) pageOrder = MULTIPLE;
  else if(isDay) pageOrder = MORNING;
  else pageOrder = NIGHT;

  setInformation();
}

function setInformation(){
  if (typeof setGreetingPage === 'function') setGreetingPage();
  checkStormMusic();
  if (typeof setAlertPage === 'function') setAlertPage();
  if (typeof setForecast === 'function') setForecast();
  if (typeof setOutlook === 'function') setOutlook();
  if (typeof createLogoElements === 'function') createLogoElements();
  if (typeof setCurrentConditions === 'function') setCurrentConditions();
  if (typeof setTimelineEvents === 'function') setTimelineEvents();

  hideSettings();
  setTimeout(startAnimation, 1000);
}

function startAnimation(){
  if (typeof setInitialPositionCurrentPage === 'function') setInitialPositionCurrentPage();
  jingle.play();
  setTimeout(startMusic, 5000)
  executeGreetingPage();
}

function executeGreetingPage(){
  getElement('background-image').classList.remove("below-screen");
  getElement('content-container').classList.add('shown');
  getElement('infobar-twc-logo').classList.add('shown');
  getElement('hello-text').classList.add('shown');
  getElement('hello-location-text').classList.add('shown');
  getElement('greeting-text').classList.add('shown');
  getElement('local-logo-container').classList.add("shown");
  setTimeout(clearGreetingPage, 6000); 
}

function clearGreetingPage(){
  getElement('greeting-text').classList.remove('shown');
  getElement('local-logo-container').classList.remove('shown');
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  
  schedulePages();
  loadInfoBar();
  revealTimeline();
  setTimeout(showCrawl, 3000);
}

// =======================
// PAGE SYSTEM (UNCHANGED)
// =======================
function schedulePages(){
  var cumlativeTime = 0;
  for(var p = 0; p < pageOrder.length; p++){
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {
      var startTime = cumlativeTime;
      var clearTime = cumlativeTime + pageOrder[p].subpages[s].duration;
      setTimeout(executePage, startTime, p, s);
      setTimeout(clearPage, clearTime, p, s);
      cumlativeTime = clearTime;
    }
  }
}

// (executePage, clearPage, radar, UI, etc remain EXACTLY unchanged)
// =======================
// EVERYTHING ABOVE STILL SAME
// =======================


// =======================
// 🔥 FIXED LOOP ENGINE
// =======================

function clearEnd(){
  setTimeout(silentRestart, 1200);
}

function silentRestart(){

  // reset visuals only (safe)
  const subPageElements = document.querySelectorAll('.subpage');

  subPageElements.forEach(el => {
    el.style.transition = 'none';
    el.style.visibility = 'hidden';
    el.style.top = '1080px';
    el.style.left = '0px';
    el.style.opacity = '1';
    void el.offsetHeight;
  });

  // reset UI positions
  const resetEls = [
    'progressbar',
    'timeline-event-container',
    'progress-stack',
    'logo-stack',
    'content-container'
  ];

  resetEls.forEach(id => {
    const el = getElement(id);
    if (!el) return;
    el.style.transition = 'none';
    el.style.left = '0px';
    el.classList.remove('progress');
  });

  currentLogoIndex = 0;
  currentLogo = undefined;

  // 🔥 IMPORTANT: force fresh data every cycle
  if (typeof fetchCurrentWeather === 'function') {
    fetchCurrentWeather(true);
  }

  // clean restart (no drift, no timeout issues)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scheduleTimeline();
    });
  });
}

// =======================
// HELPERS (UNCHANGED BELOW)
// =======================
function getElement(id){ return document.getElementById(id); }