// Timings: Weather slides 17s (17000ms), Greeting 6s
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Today", subpages: [{name: "today-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "tomorrow-night-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]

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
    if (typeof weather !== 'undefined') weather.load();
  }
}

function preLoadMusic(){
  var index = Math.floor(Math.random() * 12) + 1;
  music = new Audio("assets/music/" + index + ".wav");
}

function scheduleTimeline(){
  if(typeof alerts !== 'undefined' && alerts.length == 1) pageOrder = SINGLE;
  else if(isDay) pageOrder = MORNING;
  else pageOrder = NIGHT;
  setInformation();
}

function setInformation(){
  // SAFETY: Ensure these exist in your other files or defined here
  if (typeof setGreetingPage === 'function') setGreetingPage();
  if (typeof checkStormMusic === 'function') checkStormMusic();
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
  var bg = getElement('background-image');
  if(bg) bg.style.backgroundImage = 'url(https://picsum.photos/1920/1080/?random';
}

function startAnimation(){
  if(typeof setInitialPositionCurrentPage === 'function') setInitialPositionCurrentPage();
  jingle.play();
  setTimeout(startMusic, 5000)
  executeGreetingPage();
}

function startMusic(){ music.play(); }

function hideSettings(){
  var prompt = getElement('settings-prompt');
  var container = getElement('settings-container');
  if(prompt) prompt.classList.add('hide');
  if(container) container.style.pointerEvents = 'none';
}

function executeGreetingPage(){
  const allSubPages = ['current-page', 'radar-page', 'zoomed-radar-page', 'today-page', 'tonight-page', 'tomorrow-page', 'tomorrow-night-page', '7day-page', 'single-alert-page', 'multiple-alerts-page'];
  allSubPages.forEach(page => {
    let el = getElement(page);
    if (el) {
        el.style.top = '1080px'; 
        el.style.opacity = '0';
        el.style.visibility = 'hidden'; 
    }
  });

  var locText = getElement('hello-location-text');
  if(locText) locText.innerHTML = CONFIG.locationName || "Local Forecast";
  
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
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  
  schedulePages();
  loadInfoBar();
  if(typeof revealTimeline === 'function') revealTimeline();
  setTimeout(showCrawl, 3000);
}

function schedulePages(){
  var cumulativeTime = 0;
  for(var p = 0; p < pageOrder.length; p++){
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {
      var startTime = cumulativeTime;
      var clearTime = cumulativeTime + pageOrder[p].subpages[s].duration;
      setTimeout(executePage, startTime, p, s);
      setTimeout(clearPage, clearTime, p, s);
      cumulativeTime = clearTime;
    }
  }
}

function executePage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);

  if(!currentSubPageElement) return;

  currentSubPageElement.style.visibility = 'visible';
  currentSubPageElement.style.transition = 'none';
  currentSubPageElement.style.top = '1080px'; 
  currentSubPageElement.style.opacity = '1';
  void currentSubPageElement.offsetWidth; 

  // SNAPPY ROLL IN (0.5s)
  currentSubPageElement.style.transition = 'top 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
  currentSubPageElement.style.top = '0px';

  if(subPageIndex === 0){
      let pageTime = 0;
      currentPage.subpages.forEach(sp => pageTime += sp.duration);
      var pb = getElement('progressbar');
      if(pb) {
          pb.style.transitionDuration = pageTime + "ms";
          pb.classList.add('progress');
      }
  }

  if(currentSubPageName == "current-page" && typeof currentTemperature !== 'undefined'){
    setTimeout(loadCC, 500);
    animateValue('cc-temperature-text', -20, currentTemperature, 2000, 1);
  }
}

function clearPage(pageIndex, subPageIndex){
  var currentSubPageElement = getElement(pageOrder[pageIndex].subpages[subPageIndex].name);
  var isLastPage = (pageIndex >= pageOrder.length - 1) && (subPageIndex >= pageOrder[pageIndex].subpages.length - 1);

  if(!currentSubPageElement) return;

  currentSubPageElement.style.transition = 'top 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67), opacity 0.5s ease';
  currentSubPageElement.style.top = '-1080px';
  
  if(isLastPage) {
      setTimeout(() => {
          getElement("content-container").classList.add("expand");
          setTimeout(() => location.reload(), 2000);
      }, 600);
  }
}

function loadCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '0px'; }
}

function loadInfoBar(){
  getElement("infobar-local-logo").classList.add("shown");
  getElement("infobar-location-container").classList.add("shown");
  getElement("infobar-time-container").classList.add("shown");
}

function setClockTime(){
  var currentTime = new Date();
  var h = currentTime.getHours();
  var m = currentTime.getMinutes();
  if(h == 0) h = 12; else if(h > 12) h = h - 12;
  if(m < 10) m = "0" + m;
  var el = getElement("infobar-time-text");
  if(el) el.innerHTML = h + ":" + m;
  setTimeout(setClockTime, 5000);
}

function animateValue(id, start, end, duration, pad) {
  var obj = getElement(id);
  if(!obj) return;
  var range = end - start;
  var current = start;
  var increment = end > start? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / (range || 1))) || 20;
  var timer = setInterval(function() {
      current += increment;
      obj.innerHTML = current.pad(pad);
      if (current == end) clearInterval(timer);
  }, stepTime);
}

function getElement(id){ return document.getElementById(id); }

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function showCrawl(){
  var el = getElement('crawler-container');
  var tx = getElement('crawl-text');
  if (el && tx && CONFIG.crawlText){
    tx.innerHTML = CONFIG.crawlText;
    el.classList.add("shown");
    setTimeout(startCrawl, 400);
  }
}

function startCrawl(){
  var el = getElement('crawl-text');
  if(el) {
    calculateCrawlSpeed();
    el.classList.add('animate');
  }
}

function calculateCrawlSpeed() {
  var crawlTextElement = getElement('crawl-text');
  if(!crawlTextElement) return;
  var elementLength = crawlTextElement.innerHTML.length || 100;
  var timeTaken = (elementLength < (crawlScreenTime*crawlSpeedCasual) - crawlSpace) ? (elementLength + crawlSpace) / crawlSpeedCasual : (elementLength > (crawlScreenTime*crawlSpeedFast)) ? elementLength / crawlSpeedFast : crawlScreenTime;
  crawlTextElement.style.animationDuration = timeTaken + "s";
}

function resizeWindow(){
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var newScale = (ww/wh < 1920/1080) ? ww / 1920 : wh / 1080;
  var el = getElement('render-frame');
  if(el) el.style.transform = 'scale(' + newScale + ',' +  newScale + ')';
}
window.onresize = resizeWindow;
