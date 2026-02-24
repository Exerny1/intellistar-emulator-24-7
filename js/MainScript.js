// Preset timeline sequences - ALL TIMINGS SET TO 17000ms
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
  }
}

function toggleAdvancedSettings(){
  let advancedSettingsOptions = getElement('advanced-settings-options')
  let advancedOptionsText = getElement('advanced-options-text')
  var advancedSettingsHidden = advancedSettingsOptions.classList.contains('hidden')
  if(advancedSettingsHidden){
    advancedSettingsOptions.classList.remove('hidden')
    advancedOptionsText.innerHTML = 'Hide advanced options'
  }
  else{
    advancedSettingsOptions.classList.add('hidden')
    advancedOptionsText.innerHTML = 'Show advanced options'
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

  // --- START SNAPPY ROLL ---
  currentSubPageElement.style.transition = 'top 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
  currentSubPageElement.style.top = '0px';
  currentSubPageElement.style.left = '0px';
  // --- END SNAPPY ROLL ---

  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;
  if(isLastPage) setTimeout(hideCrawl, 2000);

  if(currentSubPageName == "current-page"){
    setTimeout(loadCC, 1000);
    setTimeout(scrollCC, currentSubPageDuration / 2);
    animateValue('cc-temperature-text', -20, currentTemperature, 2500, 1);
    animateDialFill('cc-dial-color', currentTemperature, 2500);
  }
  else if(currentSubPageName == 'radar-page') startRadar();
  else if(currentSubPageName == 'zoomed-radar-page') startZoomedRadar();
}

function clearPage(pageIndex, subPageIndex){
  var currentPage = pageOrder[pageIndex];
  var currentSubPageElement = getElement(currentPage.subpages[subPageIndex].name);
  var isNewPage = currentPage.subpages.length-1 == subPageIndex;
  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;

  if(isNewPage && !isLastPage) resetProgressBar();

  if(isLastPage) endSequence();
  else {
    // SNAPPY EXIT TO TOP
    currentSubPageElement.style.transition = 'top 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
    currentSubPageElement.style.top = '-1080px';
  }
}

function resetProgressBar(){
  getElement('progressbar').style.transitionDuration = '0ms';
  getElement('progressbar').classList.remove('progress');
  void getElement('progressbar').offsetWidth;
}

function startRadar(){ getElement('radar-container').appendChild(radarImage); }
function startZoomedRadar(){ getElement('zoomed-radar-container').appendChild(zoomedRadarImage); }

function loadCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '0px'; }
}

function scrollCC(){
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '-80px'; }
  var pressureArray = pressure.toString().split('.');
  animateValue("cc-visibility", 0, visibility, 800, 1);
  if(CONFIG.units != 'm') {
      getElement("cc-visibility-unit-metric").style.fontSize = "0px";
      getElement("cc-visibility-unit-metric").style.visibility = "hidden";
  } else {
      getElement("cc-visibility-unit-imperial").style.fontSize = "0px";
      getElement("cc-visibility-unit-imperial").style.visibility = "hidden";
  }
  animateValue("cc-humidity", 0, humidity, 1000, 1);
  animateValue("cc-dewpoint", 0, dewPoint, 1200, 1);
  if (CONFIG.units === 'e') {
    animateValue("cc-pressure1", 0, pressureArray[0], 1400, 1);
    animateValue("cc-pressure2", 0, pressureArray[1], 1400, 2);
    getElement("cc-pressure-metric").style.fontSize = "0px";
    getElement("cc-pressure-metric").style.visibility = "hidden";
  } else {
      animateValue("cc-pressure1", 800, pressureArray[0], 1400, 3);
      getElement("cc-pressure2").style.visibility = "hidden";
      getElement("cc-pressure2").style.fontSize = "0px";
      getElement("cc-pressure-decimal").style.visibility = "hidden";
      getElement("cc-pressure-decimal").style.fontSize = "0px";
  }
}

function endSequence(){ clearInfoBar(); }

function twcLogoClick() {
  var alertMessageShown = getElement('alert-message').classList.contains('shown');
  if(alertMessageShown) return;
  var loopStatus = localStorage.getItem('loop');
  if(loopStatus == "y"){
    localStorage.setItem('loop', 'n');
    CONFIG.loop = false;
  }
  else{
    localStorage.setItem('loop', 'y');
    CONFIG.loop = true;
  }
  showLoopMessage();
}

function clearInfoBar(){
  getElement("infobar-twc-logo").classList.add("hidden");
  getElement("infobar-local-logo").classList.add("hidden");
  getElement("infobar-location-container").classList.add("hidden");
  getElement("infobar-time-container").classList.add("hidden");
  setTimeout(clearElements, 200);
}

function clearElements(){
  getElement("outlook-titlebar").classList.add('hidden');
  getElement("forecast-left-container").classList.add('hidden');
  getElement("forecast-right-container").classList.add('hidden');
  getElement("content-container").classList.add("expand");
  getElement("timeline-container").style.visibility = "hidden";
  showEnding();
  setTimeout(clearEnd, 2000);
}

function showEnding(){
  if(alertsActive) stayUpdated();
  else itsAmazingOutThere();
}

function itsAmazingOutThere(){
  getElement('amazing-text').classList.add('extend');
  getElement("amazing-logo").classList.add('shown');
  getElement("amazing-container").classList.add('hide');
}

function stayUpdated(){
  getElement('updated-text').classList.add('extend');
  getElement("updated-logo").classList.add('shown');
  getElement("updated-container").classList.add('hide');
}

function clearEnd(){
  getElement('background-image').classList.add("above-screen");
  getElement('content-container').classList.add("above-screen");
  setTimeout(reloadPage, 400)
}

function reloadPage(){ location.reload() }

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
  if(!obj || start == end) { if(obj) obj.innerHTML = end; return; }
  var range = end - start;
  var current = start;
  var increment = end > start? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / range));
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
  if(!obj || start == end) { if(obj) obj.style.fill = getTemperatureColor(temperature); return; }
  var range = end - start;
  var current = start;
  var increment = end > start? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / range));
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
  var calculatedColor = [0, 0, 0]
  if(temperature < 40){
    var percent = (temperature + 20)/60
    calculatedColor = interpolateColor([24, 100, 171], [77, 171, 247], percent)
  }
  else if(temperature < 60){
    var percent = (temperature - 40)/20
    calculatedColor = interpolateColor([77, 171, 247], [255, 212, 59], percent)
  }
  else if(temperature < 80){
    var percent = (temperature - 60)/20
    calculatedColor = interpolateColor([255, 212, 59], [247, 103, 7], percent)
  }
  else{
    var percent = (temperature - 80)/20
    calculatedColor = interpolateColor([247, 103, 7], [201, 42, 42], percent)
  }
  return 'rgb(' + calculatedColor[0] + ', ' + calculatedColor[1] + ', ' + calculatedColor[2] + ')'
}

var interpolateColor = function(color1, color2, factor) {
  if (arguments.length < 3) { factor = 0.5; }
  var result = color1.slice();
  for (var i=0;i<3;i++) { result[i] = Math.round(result[i] + factor*(color2[i]-color1[i])); }
  return result;
};

const baseSize = { w: 1920, h: 1080 }

function resizeWindow(){
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var newScale = (ww/wh < baseSize.w/baseSize.h) ? ww / baseSize.w : wh / baseSize.h;
  getElement('render-frame').style.transform = 'scale(' + newScale + ',' +  newScale + ')';
}

function getElement(id){ return document.getElementById(id); }

function showCrawl(){
  if (CONFIG.crawl.length > 0){
    getElement('crawler-container').classList.add("shown");
    setTimeout(startCrawl, 400);
  }
}

function hideCrawl(){ getElement('crawler-container').classList.add("hidden"); }

function startCrawl(){
  calculateCrawlSpeed();
  getElement('crawl-text').classList.add('animate');
}

function calculateCrawlSpeed() {
  var crawlTextElement = getElement('crawl-text');
  var elementLength = crawlTextElement.innerHTML.length;
  var timeTaken;
  if (elementLength < ( crawlScreenTime*crawlSpeedCasual) - crawlSpace ) timeTaken = (elementLength + crawlSpace) / crawlSpeedCasual;
  else if (elementLength > (crawlScreenTime*crawlSpeedFast)) timeTaken = elementLength / crawlSpeedFast;
  else timeTaken = crawlScreenTime;
  crawlTextElement.style.animationDuration = timeTaken + "s";
}

function showLoopMessage(){
  var loopStatus = ((CONFIG.loop) ? 'enabled' : 'disabled');
  alert("Looping " + loopStatus + ", click TWC logo to toggle");
}

function hideAlertMessage(){ getElement('alert-message').classList.remove('shown'); }

function alert(message){
  getElement('alert-message').innerHTML = message;
  getElement('alert-message').classList.add('shown');
  setTimeout(hideAlertMessage, 2000);
}
