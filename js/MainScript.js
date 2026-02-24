// Timings: All slides locked to 18 seconds (18000ms)
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 18000}, {name: "radar-page", duration: 18000}]},{name: "Today", subpages: [{name: "today-page", duration: 18000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 18000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 18000}, {name: "7day-page", duration: 18000}]},]
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 18000}, {name: "radar-page", duration: 18000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 18000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 18000}, {name: "tomorrow-night-page", duration: 18000}, {name: "7day-page", duration: 18000}]},]
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 18000}]},{name: "Now", subpages: [{name: "current-page", duration: 18000}, {name: "radar-page", duration: 18000}, {name: "zoomed-radar-page", duration: 18000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 18000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 18000}, {name: "7day-page", duration: 18000}]},]
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 18000}]},{name: "Now", subpages: [{name: "current-page", duration: 18000}, {name: "radar-page", duration: 18000}, {name: "zoomed-radar-page", duration: 18000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 18000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 18000}, {name: "7day-page", duration: 18000}]},]
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
    if (typeof weather !== 'undefined') weather.load();
  }
}

function preLoadMusic(){
  var index = Math.floor(Math.random() * 12) + 1;
  music = new Audio("assets/music/" + index + ".wav");
}

function scheduleTimeline(){
  if(alerts.length == 1) pageOrder = SINGLE;
  else if(alerts.length > 1) pageOrder = MULTIPLE;
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
  setGreetingPage();
  checkStormMusic();
  setAlertPage();
  setForecast();
  setOutlook();
  createLogoElements();
  setCurrentConditions();
  setTimelineEvents();
  hideSettings();
  setTimeout(startAnimation, 1000);
}

function setMainBackground(){
  getElement('background-image').style.backgroundImage = 'url(https://picsum.photos/1920/1080/?random';
}

function checkStormMusic(){
  if(currentCondition.toLowerCase().includes("storm")){
    music= new Audio("assets/music/storm.wav");
  }
}

function startAnimation(){
  setInitialPositionCurrentPage();
  jingle.play();
  setTimeout(startMusic, 5000)
  executeGreetingPage();
}

function startMusic(){ music.play(); }

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
  setTimeout(clearGreetingPage, 2500);
}

function clearGreetingPage(){
  getElement('greeting-text').classList.remove('shown');
  getElement('local-logo-container').classList.remove('shown');
  getElement('greeting-text').classList.add('hidden');
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  getElement("local-logo-container").classList.add("hidden");
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

function executePage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var currentSubPageDuration = currentPage.subpages[subPageIndex].duration;

  if(subPageIndex === 0){
    var pageTime = 0;
    for (var i = 0; i < currentPage.subpages.length; i++) {
      pageTime += currentPage.subpages[i].duration;
    }
      getElement('progressbar').style.transitionDuration = pageTime + "ms";
      getElement('progressbar').classList.add('progress');
      getElement('timeline-event-container').style.left = (-280*pageIndex).toString() + "px";
      getElement('progress-stack').style.left = (-280*pageIndex).toString() + "px";
  }

  if(currentLogo != getPageLogoFileName(currentSubPageName)){
    getElement('logo-stack').style.left = ((-85*currentLogoIndex)-(20*currentLogoIndex)).toString() + "px";
    currentLogo = getPageLogoFileName(currentSubPageName);
    currentLogoIndex++;
  }

  // VERTICAL ROLL IN
  currentSubPageElement.style.transition = 'top 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
  currentSubPageElement.style.top = '0px';
  currentSubPageElement.style.left = '0px';

  if(currentSubPageName == "current-page"){
    setTimeout(loadCC, 1000);
    setTimeout(scrollCC, currentSubPageDuration / 2);
    animateValue('cc-temperature-text', -20, currentTemperature, 2500, 1);
    animateDialFill('cc-dial-color', currentTemperature, 2500);
  }
  else if(currentSubPageName == 'radar-page') startRadar();
}

function clearPage(pageIndex, subPageIndex){
  var currentSubPageElement = getElement(pageOrder[pageIndex].subpages[subPageIndex].name);
  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;

  if(isLastPage) endSequence();
  else {
    // VERTICAL ROLL OUT
    currentSubPageElement.style.transition = 'top 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
    currentSubPageElement.style.top = '-1080px';
  }
}

function resetProgressBar(){
  getElement('progressbar').style.transitionDuration = '0ms';
  getElement('progressbar').classList.remove('progress');
  void getElement('progressbar').offsetWidth;
}

function startRadar(){ getElement('radar-container').appendChild(radarImage); }

function loadCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '0px'; }
}

function scrollCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '-80px'; }
  var pressureArray = pressure.toString().split('.');
  animateValue("cc-visibility", 0, visibility, 800, 1);
  animateValue("cc-humidity", 0, humidity, 1000, 1);
  animateValue("cc-dewpoint", 0, dewPoint, 1200, 1);
}

function endSequence(){ 
  getElement("infobar-twc-logo").classList.add("hidden");
  getElement("infobar-local-logo").classList.add("hidden");
  getElement("infobar-location-container").classList.add("hidden");
  getElement("infobar-time-container").classList.add("hidden");
  setTimeout(() => {
    getElement("content-container").classList.add("expand");
    setTimeout(() => location.reload(), 2000);
  }, 200);
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
  getElement("infobar-time-text").innerHTML = h + ":" + m;
  setTimeout(setClockTime, 5000);
}

function animateValue(id, start, end, duration, pad) {
  var obj = getElement(id);
  if(!obj) return;
  var range = end - start;
  var current = start;
  var increment = end > start? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / (range || 1)));
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

window.onresize = resizeWindow;
function resizeWindow(){
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var newScale = (ww/wh < 1920/1080) ? ww / 1920 : wh / 1080;
  getElement('render-frame').style.transform = 'scale(' + newScale + ',' +  newScale + ')';
}
