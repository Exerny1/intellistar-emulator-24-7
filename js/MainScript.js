// Timings: Weather 17s, Greeting 6s
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Today", subpages: [{name: "today-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},];
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "tomorrow-night-page", duration: 17000}, {name: "7day-page", duration: 17000}]},];
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},];
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},];

const jingle = new Audio("assets/music/jingle.wav");
const WEEKDAY = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];

var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;

window.onload = function () {
    if (typeof CONFIG !== 'undefined') {
        CONFIG.addLocationOption('airport-code', 'Airport', 'ATL or KATL');
        CONFIG.addLocationOption('zip-code', 'Postal', '00000');
        CONFIG.addOption('crawlText', 'Crawl Text', 'Text that scrolls along the bottom');
        CONFIG.addOption('greetingText', 'Greeting Text', 'Message (or joke) that appears at the start');
        CONFIG.load();
    }
    preLoadMusic();
    setMainBackground();
    resizeWindow();
    setClockTime();
    
    if (typeof CONFIG !== 'undefined' && !CONFIG.loop) {
        if (getElement("settings-container")) getElement("settings-container").style.display = 'block';
        if (typeof guessZipCode === 'function') guessZipCode();
    } else {
        if (typeof fetchCurrentWeather === 'function') fetchCurrentWeather();
    }
};

function preLoadMusic() {
    var index = Math.floor(Math.random() * 12) + 1;
    music = new Audio("assets/music/" + index + ".wav");
}

function scheduleTimeline() {
    if (typeof alerts !== 'undefined' && alerts.length == 1) pageOrder = SINGLE;
    else if (typeof alerts !== 'undefined' && alerts.length > 1) pageOrder = MULTIPLE;
    else if (isDay) pageOrder = MORNING;
    else pageOrder = NIGHT;
    setInformation();
}

function startAnimation() {
    if (typeof setInitialPositionCurrentPage === 'function') setInitialPositionCurrentPage();
    if (jingle) jingle.play().catch(e => console.log("Audio blocked"));
    setTimeout(startMusic, 5000);
    executeGreetingPage();
}

function startMusic() { if (music) music.play().catch(e => {}); }

function executeGreetingPage() {
    if (getElement('background-image')) getElement('background-image').classList.remove("below-screen");
    if (getElement('content-container')) getElement('content-container').classList.add('shown');
    
    const ids = ['infobar-twc-logo', 'hello-text', 'hello-location-text', 'greeting-text', 'local-logo-container'];
    ids.forEach(id => { if (getElement(id)) getElement(id).classList.add('shown'); });
    
    setTimeout(clearGreetingPage, 6000);
}

function clearGreetingPage() {
    if (getElement('greeting-text')) getElement('greeting-text').classList.remove('shown');
    if (getElement('local-logo-container')) getElement('local-logo-container').classList.remove('shown');
    if (getElement('hello-text-container')) getElement('hello-text-container').classList.add('hidden');
    if (getElement("hello-location-container")) getElement("hello-location-container").classList.add("hidden");

    schedulePages();
    loadInfoBar();
    revealTimeline();
    setTimeout(showCrawl, 3000);
}

function schedulePages() {
    var cumulativeTime = 0;
    if (!pageOrder) return;
    for (var p = 0; p < pageOrder.length; p++) {
        for (var s = 0; s < pageOrder[p].subpages.length; s++) {
            var startTime = cumulativeTime;
            var clearTime = cumulativeTime + pageOrder[p].subpages[s].duration;
            setTimeout(executePage, startTime, p, s);
            setTimeout(clearPage, clearTime, p, s);
            cumulativeTime = clearTime;
        }
    }
}

function executePage(pageIndex, subPageIndex) {
    var currentPage = pageOrder[pageIndex];
    var sub = currentPage.subpages[subPageIndex];
    var el = getElement(sub.name);
    if (!el) return;

    el.style.visibility = 'visible';
    el.style.top = '1080px';
    el.style.opacity = '1';
    void el.offsetWidth;
    el.style.transition = 'top 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    el.style.top = '0px';

    if (subPageIndex === 0) {
        let pageTime = 0;
        currentPage.subpages.forEach(sp => pageTime += sp.duration);
        let bar = getElement('progressbar');
        if (bar) {
            bar.style.transitionDuration = pageTime + "ms";
            bar.classList.add('progress');
        }
        if (getElement('timeline-event-container')) getElement('timeline-event-container').style.left = (-280 * pageIndex).toString() + "px";
        if (getElement('progress-stack')) getElement('progress-stack').style.left = (-280 * pageIndex).toString() + "px";
    }

    if (sub.name == "current-page") {
        setTimeout(loadCC, 800);
        if (typeof animateValue === 'function') animateValue('cc-temperature-text', -20, (typeof currentTemperature !== 'undefined' ? currentTemperature : 70), 2500, 1);
    }
}

function clearPage(pageIndex, subPageIndex) {
    var sub = pageOrder[pageIndex].subpages[subPageIndex];
    var el = getElement(sub.name);
    var isLast = (pageIndex >= pageOrder.length - 1) && (subPageIndex >= pageOrder[pageIndex].subpages.length - 1);
    if (!el) return;

    el.style.top = '-1080px';
    if (isLast) {
        el.style.opacity = '0';
        endSequence();
    }
}

function endSequence() {
    const bar = getElement("infobar-twc-logo");
    if (bar) bar.classList.add("hidden");
    if (getElement("infobar-local-logo")) getElement("infobar-local-logo").classList.add("hidden");
    if (getElement("infobar-location-container")) getElement("infobar-location-container").classList.add("hidden");
    if (getElement("infobar-time-container")) getElement("infobar-time-container").classList.add("hidden");
    
    setTimeout(() => {
        if (getElement("content-container")) getElement("content-container").classList.add("expand");
        setTimeout(clearEnd, 2000);
    }, 200);
}

function clearEnd() {
    if (getElement('background-image')) getElement('background-image').classList.add("above-screen");
    if (getElement('content-container')) getElement('content-container').classList.add("above-screen");
    setTimeout(silentRestart, 1000);
}

function silentRestart() {
    var id = window.setTimeout(function() {}, 0);
    while (id--) { window.clearTimeout(id); }
    
    currentLogoIndex = 0;
    const resetList = ['infobar-twc-logo', 'infobar-local-logo', 'infobar-location-container', 'infobar-time-container', 'content-container', 'background-image', 'hello-text', 'progressbar'];
    resetList.forEach(id => {
        let el = getElement(id);
        if (el) el.classList.remove('shown', 'hidden', 'expand', 'above-screen', 'progress');
    });

    if (getElement('background-image')) getElement('background-image').classList.add("below-screen");
    
    if (typeof fetchCurrentWeather === 'function') fetchCurrentWeather();
    else scheduleTimeline();
}

function loadInfoBar() {
    if (getElement("infobar-local-logo")) getElement("infobar-local-logo").classList.add("shown");
    if (getElement("infobar-location-container")) getElement("infobar-location-container").classList.add("shown");
    if (getElement("infobar-time-container")) getElement("infobar-time-container").classList.add("shown");
}

function setClockTime() {
    var currentTime = new Date();
    var h = currentTime.getHours();
    var m = currentTime.getMinutes();
    if (h == 0) h = 12; else if (h > 12) h -= 12;
    if (m < 10) m = "0" + m;
    let el = getElement("infobar-time-text");
    if (el) el.innerHTML = h + ":" + m;
    setTimeout(setClockTime, 5000);
}

function getElement(id) { return document.getElementById(id); }
function setMainBackground() { if (getElement('background-image')) getElement('background-image').style.backgroundImage = 'url(https://picsum.photos/1920/1080/?random)'; }
function resizeWindow() {
    var ww = window.innerWidth, wh = window.innerHeight;
    var newScale = Math.min(ww / 1920, wh / 1080);
    if (getElement('render-frame')) getElement('render-frame').style.transform = 'scale(' + newScale + ')';
}

// Ensure these exist so animateValue doesn't crash
function animateValue(id, start, end, duration, pad) {
    var obj = getElement(id); if (!obj) return;
    var range = end - start, current = start, increment = end > start ? 1 : -1;
    var stepTime = Math.abs(Math.floor(duration / (range || 1))) || 10;
    var timer = setInterval(function () {
        current += increment; obj.innerHTML = (typeof current.pad === 'function') ? current.pad(pad) : current;
        if (current == end) clearInterval(timer);
    }, stepTime);
}

function revealTimeline() {
    if (getElement('timeline-event-container')) getElement('timeline-event-container').classList.add('shown');
    if (getElement('progressbar-container')) getElement('progressbar-container').classList.add('shown');
    if (getElement('logo-stack')) getElement('logo-stack').classList.add('shown');
}

function loadCC() {
    var ccElements = document.querySelectorAll(".cc-vertical-group");
    for (var i = 0; i < ccElements.length; i++) { ccElements[i].style.top = '0px'; }
}

function showCrawl() {
    if (typeof CONFIG !== 'undefined' && CONFIG.crawlText && getElement('crawler-container')) {
        getElement('crawler-container').classList.add("shown");
    }
}
