const vox = {
    current: new Audio('assets/audio/Our current conditions.mp3.mp3'),
    radar: new Audio('assets/audio/Localdopplerradar.mp3.mp3'),
    forecast: new Audio('assets/audio/Yourlocalforecast.mp3.mp3'),
    outlook: new Audio('assets/audio/7dayoutlook.mp3.mp3')
};

// This function handles the 17-second gap and plays the next file
function sequenceVox(currentClip, nextClip) {
    currentClip.onended = () => {
        setTimeout(() => {
            nextClip.play();
        }, 17000); // Waits 17s after the clip ends to start the next
    };
}

function startVocalLoop() {
    // 1. Initial 10-second delay for the greeting message
    setTimeout(() => {
        vox.current.play();
    }, 10000);

    // 2. Chain them together
    sequenceVox(vox.current, vox.radar);    // When Current ends, wait 17s -> Radar
    sequenceVox(vox.radar, vox.forecast);   // When Radar ends, wait 17s -> Forecast
    sequenceVox(vox.forecast, vox.outlook); // When Forecast ends, wait 17s -> Outlook
    
    // 3. The Loop: When the last clip (Outlook) ends, wait 17s and restart the whole thing
    vox.outlook.onended = () => {
        setTimeout(() => {
            startVocalLoop(); 
        }, 17000);
    };
}
