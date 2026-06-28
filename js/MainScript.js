// =====================
// LOOP CONTROL (NEW)
// =====================
let sequenceRunning = false;
let restartQueued = false;

// Timings: Weather 17s, Greeting 6s
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Today", subpages: [{name: "today-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "tomorrow-night-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]

const WEEKDAY = ["SUN","MON","TUES","WED","THU","FRI","SAT"];

const jingle = new Audio("assets/music/jingle.wav");

const crawlSpeedCasual = 10;
const crawlSpeedFast = 20;
const crawlScreenTime = 45;
const crawlSpace = 70;

var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;

// =====================
// STARTUP
// =====================
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

// =====================
// LOOP ENTRY FIX (NEW)
// =====================
function scheduleTimeline(){
  isDay = (new Date().getHours() >= 6 && new Date().getHours() < 18);

  if(typeof alerts !== 'undefined' && alerts.length == 1) pageOrder = SINGLE;
  else if(typeof alerts !== 'undefined' && alerts.length > 1) pageOrder = MULTIPLE;
  else if(isDay) pageOrder = MORNING;
  else pageOrder = NIGHT;

  setInformation();
}

// =====================
// MAIN FLOW
// =====================
function setInformation(){
  if(sequenceRunning) return;
  sequenceRunning = true;

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

// =====================
// END FIX (IMPORTANT)
// =====================
function clearEnd(){
  getElement('background-image').classList.add("above-screen");
  getElement('content-container').classList.add("above-screen");

  setTimeout(() => {
    resetAllState();     // 🔥 key fix
    restartSequence();   // 🔥 key fix
  }, 1200);
}

// =====================
// SAFE RESET (NEW CORE FIX)
// =====================
function resetAllState(){
  // kill running animations by clearing DOM states only
  sequenceRunning = false;
  currentLogoIndex = 0;
  currentLogo = undefined;

  const subPageElements = document.querySelectorAll('.subpage');
  subPageElements.forEach(el => {
    el.style.transition = 'none';
    el.style.visibility = 'hidden';
    el.style.top = '1080px';
    el.style.left = '';
    el.style.opacity = '1';
  });

  const resetList = [
    'infobar-twc-logo','infobar-local-logo','infobar-location-container',
    'infobar-time-container','outlook-titlebar','content-container',
    'background-image','hello-text','hello-location-text','greeting-text',
    'crawler-container','progressbar','hello-text-container','hello-location-container',
    'local-logo-container','timeline-event-container','progress-stack'
  ];

  resetList.forEach(id => {
    let el = getElement(id);
    if(el){
      el.classList.remove('shown','hidden','expand','above-screen');
      el.style.left = '';
      el.style.top = '';
      el.style.opacity = '';
    }
  });

  getElement('background-image')?.classList.add("below-screen");

  // clear any stuck timeouts safely
  let id = window.setTimeout(()=>{},0);
  while(id--) window.clearTimeout(id);
}

// =====================
// SAFE RESTART (NEW)
// =====================
function restartSequence(){
  if(restartQueued) return;
  restartQueued = true;

  setTimeout(() => {
    restartQueued = false;

    if (typeof fetchCurrentWeather === 'function') {
      fetchCurrentWeather();
    } else {
      scheduleTimeline();
    }
  }, 800);
}

// =====================
// EVERYTHING ELSE UNTOUCHED
// =====================
// (All your existing functions remain EXACTLY as-is below)