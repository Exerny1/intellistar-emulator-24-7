// Define the files with your specific double extension
const voxCurrent = new Audio('assets/audio/Our current conditions.mp3.mp3');
const voxRadar = new Audio('assets/audio/Localdopplerradar.mp3.mp3');
const voxForecast = new Audio('assets/audio/Yourlocalforecast.mp3.mp3');
const voxOutlook = new Audio('assets/audio/7dayoutlook.mp3.mp3');

function runVocalSequence() {
    console.log("Starting Vocal Sequence...");

    // 10 Seconds: Greeting ends, "Our current conditions" plays
    setTimeout(() => { 
        voxCurrent.play(); 
    }, 10000);

    // 27 Seconds: (10s Greeting + 17s Slide) "Local doppler radar" plays
    setTimeout(() => { 
        voxRadar.play(); 
    }, 27000);

    // 44 Seconds: (Next 17s Slide) "Your local forecast" plays
    setTimeout(() => { 
        voxForecast.play(); 
    }, 44000);

    // 61 Seconds: (Next 17s Slide) "7 day outlook" plays
    setTimeout(() => { 
        voxOutlook.play(); 
    }, 61000);
}

// This part makes it work automatically
window.addEventListener('load', function() {
    // Total loop time: 10s greeting + (4 slides * 17s) = 78 seconds
    const totalLoopTime = 78000; 

    // Start the first time
    runVocalSequence();

    // Repeat forever every 78 seconds
    setInterval(() => {
        runVocalSequence();
    }, totalLoopTime);
});
