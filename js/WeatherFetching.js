/**
 * SILENT AUTO-REFRESH ENGINE 
 * Updates the data variables without restarting the slide show
 */
setInterval(function() {
    console.log("Minute update: Refreshing data silently...");
    
    // We only call the data fetching, NOT the radar/timeline functions
    // This prevents the "Overlapping" and "Restarting" issues.
    
    let location = "";
    if(CONFIG.locationMode=="POSTAL") {location=`postalKey=${zipCode}:${CONFIG.countryCode}`}
    else if (CONFIG.locationMode=="AIRPORT") {
        let airportCodeLength=airportCode.length;
        if(airportCodeLength==3){location=`iataCode=${airportCode}`}
        else if (airportCodeLength==4){location=`icaoCode=${airportCode}`}
    }

    if (location !== "") {
        fetch(`https://api.weather.com/v3/location/point?${location}&language=${CONFIG.language}&format=json&apiKey=${CONFIG.secrets.twcAPIKey}`)
        .then(res => res.json())
        .then(data => {
            latitude = data.location.latitude;
            longitude = data.location.longitude;
            
            // Re-fetch current conditions only
            return fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/current.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`);
        })
        .then(res => res.json())
        .then(data => {
            let unit = data.observation[CONFIG.unitField];
            // Update the global variables silently
            currentTemperature = Math.round(unit.temp);
            currentCondition = data.observation.phrase_32char;
            windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} ${CONFIG.units === 'm' ? 'km/h' : 'mph'}`;
            gusts = unit.gust || 'NONE';
            feelsLike = unit.feels_like;
            humidity = unit.rh;
            pressure = unit.altimeter.toPrecision(4);
            currentIcon = data.observation.icon_code;
            
            console.log("Background Update Complete. Next slide will show new data.");
            
            // IMPORTANT: We do NOT call fetchAlerts() or fetchRadar() here 
            // to avoid triggering scheduleTimeline() and overlapping slides.
        });
    }
}, 60000); 
