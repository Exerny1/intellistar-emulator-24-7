// Timings: Weather 17s, Greeting 6s
const MORNING = [
  {name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},
  {name: "Today", subpages: [{name: "today-page", duration: 17000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]}
];
const NIGHT = [
  {name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "tomorrow-night-page", duration: 17000}, {name: "7day-page", duration: 17000}]}
];
const SINGLE = [
  {name: "Alert", subpages: [{name: "single-alert-page", duration: 17000}]},
  {name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]}
];
const MULTIPLE = [
  {name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 17000}]},
  {name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},
  {name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},
  {name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]}
];

const WEEKDAY = ["SUN","MON","TUES","WED","THU","FRI","SAT"];
const jingle = new Audio("assets/music/jingle.wav");
var isDay = true;
var currentLogo, currentLogoIndex = 0, pageOrder, music;

// --- On load ---
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
}

function preLoadMusic(){
  var index = Math.floor(Math.random() * 12) + 1;
  music = new Audio("assets/music/" + index + ".wav");
}

function scheduleTimeline(){
  if(typeof alerts !== 'undefined' && alerts.length == 1) pageOrder = SINGLE;
  else if(typeof alerts !== 'undefined' && alerts.length > 1) pageOrder = MULTIPLE;
  else if(isDay) pageOrder = MORNING;
  else pageOrder = NIGHT;
  setInformation();
}

function revealTimeline(){
  getElement('timeline-event-container').classList.add('shown');
  getElement('progressbar-container').classList.add('shown');
  getElement('logo-stack').classList.add('shown');
  var timelineElements = document.querySelectorAll(".timeline-item");
  for (var i = 0; i < timelineElements.length; i++) timelineElements[i].style.top = '0px';
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

function setMainBackground(){
  getElement('background-image').style.backgroundImage = 'url(https://picsum.photos/1920/1080/?random)';
}

function checkStormMusic(){
  if(typeof currentCondition !== 'undefined' && currentCondition.toLowerCase().includes("storm"))
    music= new Audio("assets/music/storm.wav");
}

function startAnimation(){
  if (typeof setInitialPositionCurrentPage === 'function') setInitialPositionCurrentPage();
  jingle.play();
  setTimeout(startMusic, 5000);
  executeGreetingPage();
}

function startMusic(){ if(music) music.play(); }
function hideSettings(){ getElement('settings-prompt').classList.add('hide'); getElement('settings-container').style.pointerEvents = 'none'; }

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

// --- Page Execution ---
function executePage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  if(!currentSubPageElement) return;

  currentSubPageElement.style.visibility = 'visible';
  currentSubPageElement.style.transition = 'none';
  currentSubPageElement.style.left = '0px';
  currentSubPageElement.style.top = '1080px';
  currentSubPageElement.style.opacity = '1';
  void currentSubPageElement.offsetWidth;
  currentSubPageElement.style.transition = 'top 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
  currentSubPageElement.style.top = '0px';

  if(subPageIndex === 0){
    let pageTime = currentPage.subpages.reduce((sum, sp) => sum + sp.duration,0);
    getElement('progressbar').style.transitionDuration = pageTime + "ms";
    getElement('progressbar').classList.add('progress');
    getElement('timeline-event-container').style.left = (-280*pageIndex)+"px";
    getElement('progress-stack').style.left = (-280*pageIndex)+"px";
  }
}

function clearPage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  if(!currentSubPageElement) return;
  
  currentSubPageElement.style.transition = 'top 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease-in';
  currentSubPageElement.style.top = '-1080px';
  
  var isLastPage = (pageIndex >= pageOrder.length - 1) && (subPageIndex >= pageOrder[pageIndex].subpages.length - 1);
  if(isLastPage) endSequence();
}

// --- Restart / Loop ---
function silentRestart() {
    var id = window.setTimeout(function(){}, 0);
    while(id--) { if(id > 20) window.clearTimeout(id); }
    currentLogoIndex = 0; currentLogo = undefined;
    var hours = new Date().getHours();
    isDay = (hours >= 6 && hours < 18);

    document.querySelectorAll('.subpage').forEach(el=>{
        el.style.visibility='hidden'; el.style.top='1080px'; el.style.opacity='1';
        el.classList.remove('shown','hidden');
    });

    ['infobar-twc-logo','infobar-local-logo','infobar-location-container','infobar-time-container',
    'outlook-titlebar','content-container','background-image','hello-text','hello-location-text',
    'greeting-text','crawler-container','progressbar','hello-text-container','hello-location-container']
    .forEach(id=>{let el=getElement(id); if(el){el.classList.remove('shown','hidden','expand','above-screen','progress'); el.style.top=''; el.style.opacity=''; el.style.left=''; }});

    let crawl = getElement('crawl-text');
    if(crawl){ crawl.classList.remove('animate'); void crawl.offsetWidth; }
    if(getElement('background-image')) getElement('background-image').classList.add('below-screen');

    scheduleTimeline();
}

// --- Info bar / clock ---
function loadInfoBar(){
  getElement("infobar-local-logo").classList.add("shown");
  getElement("infobar-location-container").classList.add("shown");
  getElement("infobar-time-container").classList.add("shown");
}

function setClockTime(){
  var currentTime = new Date();
  var h = currentTime.getHours();
  var m = currentTime.getMinutes();
  if(h == 0) h = 12; else if(h>12) h-=12;
  if(m<10) m="0"+m;
  getElement("infobar-time-text").innerHTML = h+":"+m;
  setTimeout(setClockTime,5000);
}

// --- Util ---
function getElement(id){ return document.getElementById(id); }

const baseSize = { w: 1920, h: 1080 }
window.onresize = resizeWindow;
function resizeWindow(){
  var ww=window.innerWidth, wh=window.innerHeight;
  var newScale = (ww/wh<baseSize.w/baseSize.h)? ww/baseSize.w : wh/baseSize.h;
  var frame=getElement('render-frame');
  if(frame) frame.style.transform='scale('+newScale+','+newScale+')';
}