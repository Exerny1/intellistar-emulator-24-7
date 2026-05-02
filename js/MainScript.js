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

// ✅ NEW: track timeouts
let activeTimeouts = [];

function setT(fn, delay, ...args){
  const id = setTimeout(fn, delay, ...args);
  activeTimeouts.push(id);
  return id;
}

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

function revealTimeline(){
  getElement('timeline-event-container').classList.add('shown');
  getElement('progressbar-container').classList.add('shown');
  getElement('logo-stack').classList.add('shown');
  var timelineElements = document.querySelectorAll(".timeline-item");
  for (var i = 0; i < timelineElements.length; i++) {
    timelineElements[i].style.top = '0px';
  }
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
  setT(startAnimation, 1000);
}

function setMainBackground(){
  getElement('background-image').style.backgroundImage = 'url(https://picsum.photos/1920/1080/?random';
}

function checkStormMusic(){
  if(typeof currentCondition !== 'undefined' && currentCondition.toLowerCase().includes("storm")){
    music= new Audio("assets/music/storm.wav");
  }
}

function startAnimation(){
  if (typeof setInitialPositionCurrentPage === 'function') setInitialPositionCurrentPage();
  jingle.play();
  setT(startMusic, 5000);
  executeGreetingPage();
}

function startMusic(){ if(music) music.play(); }

function hideSettings(){
  getElement('settings-prompt').classList.add('hide');
  getElement('settings-container').style.pointerEvents = 'none';
}

function executeGreetingPage(){
  getElement('background-image').classList.remove("below-screen");
  getElement('content-container').classList.add('shown');
  getElement('infobar-twc-logo').classList.add('shown');
  getElement('hello-text').classList.add('shown');
  getElement('hello-location-text').classList.add('shown');
  getElement('greeting-text').classList.add('shown');
  getElement('local-logo-container').classList.add("shown");
  setT(clearGreetingPage, 6000); 
}

function clearGreetingPage(){
  getElement('greeting-text').classList.remove('shown');
  getElement('local-logo-container').classList.remove('shown');
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  
  schedulePages();
  loadInfoBar();
  revealTimeline();
  setT(showCrawl, 3000);
}

function schedulePages(){
  var cumulativeTime = 0;
  for(var p = 0; p < pageOrder.length; p++){
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {

      var startTime = cumulativeTime;
      var clearTime = cumulativeTime + pageOrder[p].subpages[s].duration;

      setT(executePage, startTime, p, s);
      setT(clearPage, clearTime, p, s);

      cumulativeTime = clearTime;
    }
  }
}

function executePage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var currentSubPageDuration = currentPage.subpages[subPageIndex].duration;

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
      let pageTime = 0;
      currentPage.subpages.forEach(sp => pageTime += sp.duration);
      getElement('progressbar').style.transitionDuration = pageTime + "ms";
      getElement('progressbar').classList.add('progress');
      getElement('timeline-event-container').style.left = (-280*pageIndex) + "px";
      getElement('progress-stack').style.left = (-280*pageIndex) + "px";
  }

  if(currentSubPageName == "current-page"){
    setT(loadCC, 800);
    setT(scrollCC, currentSubPageDuration / 2);
  }
}

function clearPage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var isLastPage = (pageIndex >= pageOrder.length - 1) && (subPageIndex >= pageOrder[pageIndex].subpages.length - 1);

  if(!currentSubPageElement) return;

  currentSubPageElement.style.top = '-1080px';
  
  if(isLastPage) {
      currentSubPageElement.style.opacity = '0';
      endSequence();
  } else {
    setT(() => { 
        if(currentSubPageElement.style.top === '-1080px') currentSubPageElement.style.visibility = 'hidden'; 
    }, 1300);
  }
}

function endSequence(){ clearInfoBar(); }

function clearInfoBar(){
  setT(clearElements, 200);
}

function clearElements(){
  setT(clearEnd, 2000);
}

function clearEnd(){
  setT(silentRestart, 1200);
}

// ✅ FIXED LOOP RESET
function silentRestart(){

  // Only clear OUR timeouts
  activeTimeouts.forEach(id => clearTimeout(id));
  activeTimeouts = [];

  currentLogoIndex = 0;
  currentLogo = undefined;

  const subPageElements = document.querySelectorAll('.subpage');
  subPageElements.forEach(el => {
    el.style.visibility = 'hidden';
    el.style.top = '1080px';
    el.style.opacity = '1';
  });

  if (typeof fetchCurrentWeather === 'function') {
    fetchCurrentWeather(); 
  } else {
    scheduleTimeline();
  }
}

function showCrawl(){
  if (CONFIG.crawl && CONFIG.crawl.length > 0){
    getElement('crawler-container').classList.add("shown");
    setT(startCrawl, 400);
  }
}

function startCrawl(){ calculateCrawlSpeed(); getElement('crawl-text').classList.add('animate'); }

function calculateCrawlSpeed() {
  var crawlTextElement = getElement('crawl-text');
  if(!crawlTextElement) return;
  var elementLength = crawlTextElement.innerHTML.length;
  var timeTaken = (elementLength < (crawlScreenTime*crawlSpeedCasual) - crawlSpace) ? (elementLength + crawlSpace) / crawlSpeedCasual : (elementLength > (crawlScreenTime*crawlSpeedFast) ? elementLength / crawlSpeedFast : crawlScreenTime);
  crawlTextElement.style.animationDuration = timeTaken + "s";
}

function getElement(id){ return document.getElementById(id); }