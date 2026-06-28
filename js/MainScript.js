// ===============================
// CONFIG DATA (UNCHANGED)
// ===============================

const MORNING = [
  {name:"Now",subpages:[{name:"current-page",duration:17000},{name:"radar-page",duration:17000}]},
  {name:"Today",subpages:[{name:"today-page",duration:17000}]},
  {name:"Tonight",subpages:[{name:"tonight-page",duration:17000}]},
  {name:"Beyond",subpages:[{name:"tomorrow-page",duration:17000},{name:"7day-page",duration:17000}]}
];

const NIGHT = [
  {name:"Now",subpages:[{name:"current-page",duration:17000},{name:"radar-page",duration:17000}]},
  {name:"Tonight",subpages:[{name:"tonight-page",duration:17000}]},
  {name:"Beyond",subpages:[{name:"tomorrow-page",duration:17000},{name:"tomorrow-night-page",duration:17000},{name:"7day-page",duration:17000}]}
];

const SINGLE = [
  {name:"Alert",subpages:[{name:"single-alert-page",duration:17000}]},
  {name:"Now",subpages:[{name:"current-page",duration:17000},{name:"radar-page",duration:17000},{name:"zoomed-radar-page",duration:17000}]},
  {name:"Tonight",subpages:[{name:"tonight-page",duration:17000}]},
  {name:"Beyond",subpages:[{name:"tomorrow-page",duration:17000},{name:"7day-page",duration:17000}]}
];

const MULTIPLE = [
  {name:"Alerts",subpages:[{name:"multiple-alerts-page",duration:17000}]},
  {name:"Now",subpages:[{name:"current-page",duration:17000},{name:"radar-page",duration:17000},{name:"zoomed-radar-page",duration:17000}]},
  {name:"Tonight",subpages:[{name:"tonight-page",duration:17000}]},
  {name:"Beyond",subpages:[{name:"tomorrow-page",duration:17000},{name:"7day-page",duration:17000}]}
];

const WEEKDAY=["SUN","MON","TUES","WED","THU","FRI","SAT"];

// ===============================
// GLOBAL STATE
// ===============================

const jingle = new Audio("assets/music/jingle.wav");
const crawlSpeedCasual = 10;
const crawlSpeedFast = 20;
const crawlScreenTime = 45;
const crawlSpace = 70;

let isDay = true;
let currentLogo;
let currentLogoIndex = 0;
let pageOrder;
let music;

let activeTimers = [];

// ===============================
// TIMER SAFE WRAPPER
// ===============================

function safeTimeout(fn, t, ...args){
  const id = setTimeout(fn, t, ...args);
  activeTimers.push(id);
  return id;
}

function clearAllTimers(){
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
}

// ===============================
// STARTUP
// ===============================

window.onload = function () {
  CONFIG.addLocationOption('airport-code', 'Airport', 'ATL or KATL');
  CONFIG.addLocationOption('zip-code', 'Postal', '00000');
  CONFIG.addOption('crawlText', 'Crawl Text', 'Text that scrolls along the bottom');
  CONFIG.addOption('greetingText', 'Greeting Text', 'Message (or joke) that appears at the start');
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
};

// ===============================
// FLOW (UNCHANGED LOGIC)
// ===============================

function scheduleTimeline(){
  const hour = new Date().getHours();
  isDay = (hour >= 6 && hour < 18);

  if(typeof alerts !== 'undefined' && alerts.length == 1) pageOrder = SINGLE;
  else if(typeof alerts !== 'undefined' && alerts.length > 1) pageOrder = MULTIPLE;
  else if(isDay) pageOrder = MORNING;
  else pageOrder = NIGHT;

  setInformation();
}

function setInformation(){
  if (typeof setGreetingPage === 'function') setGreetingPage();
  if (typeof setAlertPage === 'function') setAlertPage();
  if (typeof setForecast === 'function') setForecast();
  if (typeof setOutlook === 'function') setOutlook();
  if (typeof createLogoElements === 'function') createLogoElements();
  if (typeof setCurrentConditions === 'function') setCurrentConditions();
  if (typeof setTimelineEvents === 'function') setTimelineEvents();

  hideSettings();
  safeTimeout(startAnimation, 1000);
}

function startAnimation(){
  if (typeof setInitialPositionCurrentPage === 'function') setInitialPositionCurrentPage();
  jingle.play();
  safeTimeout(startMusic, 5000);
  executeGreetingPage();
}

function startMusic(){ if(music) music.play(); }

// ===============================
// GREETING
// ===============================

function executeGreetingPage(){
  getElement('background-image').classList.remove("below-screen");
  getElement('content-container').classList.add('shown');

  safeTimeout(clearGreetingPage, 6000);
}

function clearGreetingPage(){
  schedulePages();
  loadInfoBar();
  revealTimeline();
  safeTimeout(showCrawl, 3000);
}

// ===============================
// PAGE ENGINE (UNCHANGED)
// ===============================

function schedulePages(){
  let cumTime = 0;

  for(let p=0;p<pageOrder.length;p++){
    for(let s=0;s<pageOrder[p].subpages.length;s++){

      safeTimeout(executePage, cumTime, p, s);
      safeTimeout(clearPage, cumTime + pageOrder[p].subpages[s].duration, p, s);

      cumTime += pageOrder[p].subpages[s].duration;
    }
  }

  // 🔁 END OF CYCLE TRIGGER
  safeTimeout(endSequence, cumTime);
}

function executePage(pageIndex, subIndex){
  const page = pageOrder[pageIndex];
  const sub = page.subpages[subIndex];
  const el = getElement(sub.name);

  if(!el) return;

  el.style.visibility = 'visible';
  el.style.transition = 'none';
  el.style.top = '1080px';
  void el.offsetWidth;
  el.style.transition = 'top 1.2s ease';
  el.style.top = '0px';
}

function clearPage(pageIndex, subIndex){
  const page = pageOrder[pageIndex];
  const sub = page.subpages[subIndex];
  const el = getElement(sub.name);

  if(!el) return;

  el.style.top = '-1080px';
}

// ===============================
// 🔁 CLEAN LOOP SYSTEM
// ===============================

function endSequence(){
  safeTimeout(restartCycle, 1200);
}

function restartCycle(){

  // IMPORTANT: ONLY RESET TIMERS + STATE
  clearAllTimers();

  currentLogoIndex = 0;
  currentLogo = undefined;

  // reset subpages safely
  document.querySelectorAll('.subpage').forEach(el=>{
    el.style.transition='none';
    el.style.visibility='hidden';
    el.style.top='1080px';
    el.style.opacity='1';
  });

  // refresh weather each cycle (safe hook)
  if(typeof fetchCurrentWeather==='function'){
    fetchCurrentWeather(true);
  }

  // restart cleanly
  requestAnimationFrame(()=>{
    scheduleTimeline();
  });
}

// ===============================
// HELPERS (UNCHANGED)
// ===============================

function getElement(id){return document.getElementById(id);}