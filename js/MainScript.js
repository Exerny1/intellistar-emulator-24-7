// Timings: Weather 17s, Greeting 6s
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Today", subpages: [{name: "today-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "tomorrow-night-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const WEEKDAY = ["SUN",  "MON", "TUES", "WED", "THU", "FRI", "SAT"];

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
  setTimeout(startAnimation, 1000);
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
  setTimeout(startMusic, 5000)
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
  // Call removed to avoid 3s wait for a hidden element
  showCrawl(); 
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
      getElement('timeline-event-container').style.left = (-280*pageIndex).toString() + "px";
      getElement('progress-stack').style.left = (-280*pageIndex).toString() + "px";
  }

  if(currentLogo != (typeof getPageLogoFileName === 'function' ? getPageLogoFileName(currentSubPageName) : '')){
    getElement('logo-stack').style.left = ((-85*currentLogoIndex)-(20*currentLogoIndex)).toString() + "px";
    currentLogo = getPageLogoFileName(currentSubPageName);
    currentLogoIndex++;
  }

  if(currentSubPageName == "current-page"){
    setTimeout(loadCC, 800);
    setTimeout(scrollCC, currentSubPageDuration / 2);
    if(typeof animateValue === 'function') animateValue('cc-temperature-text', -20, currentTemperature, 2500, 1);
    if(typeof animateDialFill === 'function') animateDialFill('cc-dial-color', currentTemperature, 2500);
  } else if(currentSubPageName == 'radar-page'){
    startRadar();
  } else if(currentSubPageName == 'zoomed-radar-page'){
    startZoomedRadar();
  }
}

function clearPage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var isLastPage = (pageIndex >= pageOrder.length - 1) && (subPageIndex >= pageOrder[pageIndex].subpages.length - 1);

  if(!currentSubPageElement) return;

  if((currentPage.subpages.length - 1) == subPageIndex && !isLastPage) resetProgressBar();

  currentSubPageElement.style.transition = 'top 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease-in';
  currentSubPageElement.style.top = '-1080px';
  
  if(isLastPage) {
      currentSubPageElement.style.opacity = '0';
      endSequence();
  } else {
    setTimeout(() => { 
        if(currentSubPageElement.style.top === '-1080px') currentSubPageElement.style.visibility = 'hidden'; 
    }, 1300);
  }
}

function resetProgressBar(){
  getElement('progressbar').style.transitionDuration = '0ms';
  getElement('progressbar').classList.remove('progress');
  void getElement('progressbar').offsetWidth;
}

function startRadar(){ if(typeof radarImage !== 'undefined') getElement('radar-container').appendChild(radarImage); }
function startZoomedRadar(){ if(typeof zoomedRadarImage !== 'undefined') getElement('zoomed-radar-container').appendChild(zoomedRadarImage); }

function loadCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '0px'; }
}

function scrollCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '-80px'; }
  var pressureArray = (typeof pressure !== 'undefined' ? pressure.toString().split('.') : ["0","0"]);
  animateValue("cc-visibility", 0, (typeof visibility !== 'undefined' ? visibility : 0), 800, 1);
  animateValue("cc-humidity", 0, (typeof humidity !== 'undefined' ? humidity : 0), 1000, 1);
  animateValue("cc-dewpoint", 0, (typeof dewPoint !== 'undefined' ? dewPoint : 0), 1200, 1);
  if (CONFIG.units === 'e') {
    animateValue("cc-pressure1", 0, pressureArray[0], 1400, 1);
    animateValue("cc-pressure2", 0, (pressureArray[1] || "00"), 1400, 2);
  } else {
    animateValue("cc-pressure1", 800, pressureArray[0], 1400, 3);
  }
}

function endSequence(){ clearInfoBar(); }

function clearInfoBar(){
  getElement("infobar-twc-logo").classList.add("hidden");
  getElement("infobar-local-logo").classList.add("hidden");
  getElement("infobar-location-container").classList.add("hidden");
  getElement("infobar-time-container").classList.add("hidden");
  setTimeout(clearElements, 200);
}

function clearElements(){
  getElement("outlook-titlebar").classList.add('hidden');
  getElement("content-container").classList.add("expand");
  getElement("timeline-container").style.visibility = "hidden";
  setTimeout(clearEnd, 2000);
}

function clearEnd(){
  getElement('background-image').classList.add("above-screen");
  getElement('content-container').classList.add("above-screen");
  setTimeout(silentRestart, 1000);
}

function silentRestart(){
  var id = window.setTimeout(function() {}, 0);
  while (id--) { if (id > 20) window.clearTimeout(id); }
  
  setClockTime();
  currentLogoIndex = 0;
  currentLogo = undefined;
  
  const subPageElements = document.querySelectorAll('.subpage');
  subPageElements.forEach(el => {
    el.style.visibility = 'hidden';
    el.style.top = '';
    el.style.opacity = '';
    el.classList.remove('shown', 'hidden');
  });

  const resetList = [
    'infobar-twc-logo', 'infobar-local-logo', 'infobar-location-container', 
    'infobar-time-container', 'outlook-titlebar', 'content-container', 
    'background-image', 'hello-text', 'hello-location-text', 'greeting-text', 
    'crawler-container', 'progressbar', 'hello-text-container', 'hello-location-container'
  ];

  resetList.forEach(id => {
    let el = getElement(id);
    if(el) {
        el.classList.remove('shown', 'hidden', 'expand', 'above-screen', 'progress');
        el.style.top = '';
        el.style.opacity = '';
        el.style.left = '';
    }
  });

  if (getElement('crawl-text')) {
    getElement('crawl-text').classList.remove('animate');
    void getElement('crawl-text').offsetWidth;
  }
  
  if (getElement('background-image')) {
    getElement('background-image').classList.add("below-screen");
  }
  
  if (typeof fetchCurrentWeather === 'function') {
    fetchCurrentWeather(); 
  } else {
    scheduleTimeline();
  }
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
  if(h == 0) h = 12;
  else if(h > 12) h = h - 12;
  if(m < 10) m = "0" + m;
  getElement("infobar-time-text").innerHTML = h + ":" + m;
  setTimeout(setClockTime, 5000);
}

function animateValue(id, start, end, duration, pad) {
  var obj = getElement(id);
  if(!obj) return;
  if(start == end){ obj.innerHTML = end; return; }
  var range = end - start;
  var current = start;
  var increment = end > start? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / (range || 1))) || 10;
  var timer = setInterval(function() {
      current += increment;
      obj.innerHTML = current.pad(pad);
      if (current == end) clearInterval(timer);
  }, stepTime);
}

function animateDialFill(id, temperature, duration) {
  var start = -20;
  var end = temperature;
  var obj = getElement(id);
  if(!obj) return;
  var range = end - start;
  var current = start;
  var increment = end > start? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / (range || 1))) || 10;
  var timer = setInterval(function() {
      current += increment;
      obj.style.fill = getTemperatureColor(current);
      if (current == end) clearInterval(timer);
  }, stepTime);
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function getTemperatureColor(temperature){
  if(temperature < -20) return 'rgb(0, 0, 255)';
  if(temperature > 100) return 'rgb(201, 42, 42)';
  var calculatedColor = [0, 0, 0];
  if(temperature < 40){
    var percent = (temperature + 20)/60;
    calculatedColor = interpolateColor([24, 100, 171], [77, 171, 247], percent);
  } else if(temperature < 60){
    var percent = (temperature - 40)/20;
    calculatedColor = interpolateColor([77, 171, 247], [255, 212, 59], percent);
  } else if(temperature < 80){
    var percent = (temperature - 60)/20;
    calculatedColor = interpolateColor([255, 212, 59], [247, 103, 7], percent);
  } else {
    var percent = (temperature - 80)/20;
    calculatedColor = interpolateColor([247, 103, 7], [201, 42, 42], percent);
  }
  return 'rgb(' + calculatedColor[0] + ', ' + calculatedColor[1] + ', ' + calculatedColor[2] + ')';
}

var interpolateColor = function(color1, color2, factor) {
  var result = color1.slice();
  for (var i=0;i<3;i++) {
    result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
  }
  return result;
};

const baseSize = { w: 1920, h: 1080 }
window.onresize = resizeWindow;
function resizeWindow(){
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var newScale = (ww/wh < baseSize.w/baseSize.h) ? ww / baseSize.w : wh / baseSize.h;
  var frame = getElement('render-frame');
  if(frame) frame.style.transform = 'scale(' + newScale + ',' +  newScale + ')';
}

function getElement(id){ return document.getElementById(id); }

// THE CRAWL FUNCTIONS (EMPTIED TO PREVENT CRAWL STARTING)
function showCrawl(){ /* No action to prevent crawl showing */ }
function hideCrawl(){ /* No action needed */ }
function startCrawl(){ /* No action to prevent animation */ }
function calculateCrawlSpeed() { /* No action needed */ }
