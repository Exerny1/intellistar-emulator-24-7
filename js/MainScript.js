// Timings: Weather 17s, Greeting 6s
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Today", subpages: [{name: "today-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "tomorrow-night-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 17000}]},{name: "Now", subpages: [{name: "current-page", duration: 17000}, {name: "radar-page", duration: 17000}, {name: "zoomed-radar-page", duration: 17000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 17000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 17000}, {name: "7day-page", duration: 17000}]},]

const jingle = new Audio("assets/music/jingle.wav");
var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;

window.onload = function () {
    // Load Config if present
    if (typeof CONFIG !== 'undefined') {
        CONFIG.load();
    }
    preLoadMusic();
    setMainBackground();
    resizeWindow();
    setClockTime();
    
    // Check if we should auto-start or show settings
    if (typeof CONFIG !== 'undefined' && !CONFIG.loop) {
        if (document.getElementById("settings-container")) {
            document.getElementById("settings-container").style.display = 'block';
        }
    } else {
        if (typeof fetchCurrentWeather === 'function') fetchCurrentWeather();
    }
};

function startAnimation() {
    // Safety check for Weather.js functions
    if (typeof setInitialPositionCurrentPage === 'function') setInitialPositionCurrentPage();
    
    if (jingle) jingle.play().catch(e => console.log("Audio play deferred"));
    setTimeout(startMusic, 5000);
    executeGreetingPage();
}

function executeGreetingPage() {
    // Main Container Transitions
    const bg = document.getElementById('background-image');
    const content = document.getElementById('content-container');
    if (bg) bg.classList.remove("below-screen");
    if (content) content.classList.add('shown');

    // Show greeting elements
    ['hello-text', 'hello-location-text', 'greeting-text', 'local-logo-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('shown');
    });
    
    setTimeout(clearGreetingPage, 6000); 
}

function clearGreetingPage() {
    // Hide greetings and start the broadcast loop
    ['greeting-text', 'local-logo-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('shown');
    });
    
    const htc = document.getElementById('hello-text-container');
    if (htc) htc.classList.add('hidden');
    
    schedulePages();
    revealTimeline();
    setTimeout(showCrawl, 3000);
}

function schedulePages() {
    var cumulativeTime = 0;
    if (!pageOrder) return;
    
    for (var p = 0; p < pageOrder.length; p++) {
        for (var s = 0; s < pageOrder[p].subpages.length; s++) {
            const startTime = cumulativeTime;
            const clearTime = cumulativeTime + pageOrder[p].subpages[s].duration;
            
            // Capture indices for setTimeout
            (function(pageIdx, subIdx) {
                setTimeout(() => executePage(pageIdx, subIdx), startTime);
                setTimeout(() => clearPage(pageIdx, subIdx), clearTime);
            })(p, s);
            
            cumulativeTime = clearTime;
        }
    }
}

function executePage(p, s) {
    const sub = pageOrder[p].subpages[s];
    const el = document.getElementById(sub.name);
    if (!el) return;

    el.style.visibility = 'visible';
    el.style.top = '1080px'; 
    el.style.opacity = '1';
    void el.offsetWidth; 
    el.style.transition = 'top 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    el.style.top = '0px';

    // Update progress bar on first subpage of a section
    if (s === 0) {
        let sectionDuration = 0;
        pageOrder[p].subpages.forEach(sp => sectionDuration += sp.duration);
        const bar = document.getElementById('progressbar');
        if (bar) {
            bar.style.transitionDuration = sectionDuration + "ms";
            bar.classList.add('progress');
        }
    }

    // Trigger specific page animations
    if (sub.name === "current-page" && typeof loadCC === 'function') {
        setTimeout(loadCC, 800);
    }
}

function clearPage(p, s) {
    const sub = pageOrder[p].subpages[s];
    const el = document.getElementById(sub.name);
    const isLast = (p === pageOrder.length - 1) && (s === pageOrder[p].subpages.length - 1);

    if (el) {
        el.style.top = '-1080px';
        
        // At the end of a section, reset progress bar
        if (s === pageOrder[p].subpages.length - 1 && !isLast) {
            const bar = document.getElementById('progressbar');
            if (bar) {
                bar.classList.remove('progress');
                bar.style.transitionDuration = '0ms';
            }
        }
    }
    
    if (isLast) {
        setTimeout(silentRestart, 2000); 
    }
}

function silentRestart() {
    // Complete reset for 24/7 loop
    const ids = window.setTimeout(function() {}, 0);
    for (let i = 0; i < ids; i++) window.clearTimeout(i);
    
    const resetClasses = ['content-container', 'background-image', 'hello-text', 'progressbar'];
    resetClasses.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('shown', 'hidden', 'expand', 'above-screen', 'progress');
    });

    const bg = document.getElementById('background-image');
    if (bg) bg.classList.add("below-screen");
    
    // Re-fetch data and start over
    if (typeof fetchCurrentWeather === 'function') {
        fetchCurrentWeather(); 
    } else {
        scheduleTimeline();
    }
}

// --- Support Functions ---

function setClockTime() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    h = h % 12 || 12;
    m = m < 10 ? "0" + m : m;
    const el = document.getElementById("infobar-time-text");
    if (el) el.innerHTML = h + ":" + m;
    setTimeout(setClockTime, 10000);
}

function resizeWindow() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const scale = Math.min(ww / 1920, wh / 1080);
    const frame = document.getElementById('render-frame');
    if (frame) frame.style.transform = `scale(${scale})`;
}

function preLoadMusic() {
    const index = Math.floor(Math.random() * 12) + 1;
    music = new Audio(`assets/music/${index}.wav`);
}

function startMusic() { if (music) music.play().catch(e => {}); }

function revealTimeline() {
    ['timeline-event-container', 'progressbar-container', 'logo-stack'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('shown');
    });
}

function showCrawl() {
    const crawl = document.getElementById('crawler-container');
    if (crawl) crawl.classList.add("shown");
}
