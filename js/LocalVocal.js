const vox = {
    current: new Audio('assets/audio/Our current conditions.mp3.mp3'),
    radar: new Audio('assets/audio/Localdopplerradar.mp3.mp3'),
    forecast: new Audio('assets/audio/Yourlocalforecast.mp3.mp3'),
    outlook: new Audio('assets/audio/7dayoutlook.mp3.mp3')
};

function playWeatherVocals() {
    // 10 Seconds: Greeting ends, "Our current conditions" plays
    setTimeout(() => { 
        vox.current.play(); 
    }, 10000);

    // 27 Seconds: (10s Greeting + 17s Slide) "Local doppler radar" plays
    setTimeout(() => { 
        vox.radar.play(); 
    }, 27000);

    // 44 Seconds: (Next 17s Slide) "Your local forecast" plays
    setTimeout(() => { 
        vox.forecast.play(); 
    }, 44000);

    // 61 Seconds: (Next 17s Slide) "7 day outlook" plays
    setTimeout(() => { 
        vox.outlook.play(); 
    }, 61000);
}

// Logic to loop the audio when the emulator restarts the timeline
function startVocalLoop() {
    playWeatherVocals();
    
    // Adjust this number (currently 78000ms / 78s) to match your TOTAL timeline length
    // Total = 10s (Greeting) + (4 slides * 17s) = 78 seconds
    setInterval(() => {
        playWeatherVocals();
    }, 78000); 
}

