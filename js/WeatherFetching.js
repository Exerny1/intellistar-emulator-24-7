var timelineStarted = false;

function guessZipCode(){
  return;
}

function fetchAlerts(){
  var alertCrawl = "";
  fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`)
    .then(function(response) {
      response.json().then(function(data) {
        if (data.features == undefined || data.features.length == 0){
          fetchForecast();
          return;
        }
        for(var i = 0; i < data.features.length; i++){
          alertCrawl = alertCrawl + " " + data.features[i].properties.description.replace("...", " ");
          alerts[i] = data.features[i].properties.event;
        }
        if(alertCrawl != ""){ CONFIG.crawl = alertCrawl; }
        alertsActive = alerts.length > 0;
        fetchForecast();
      });
    });
}

function fetchForecast(){
  fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/forecast/daily/10day.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
    .then(function(response) {
      response.json().then(function(data) {
        let forecasts = data.forecasts;
        isDay = forecasts[0].day; 
        let ns = [forecasts[0].day || forecasts[0].night, forecasts[0].night, forecasts[1].day, forecasts[1].night];
        for (let i = 0; i <= 3; i++) {
          let n = ns[i];
          forecastTemp[i] = n.temp;
          forecastIcon[i] = n.icon_code;
          forecastNarrative[i] = n.narrative;
          forecastPrecip[i] = `${n.pop}% Chance<br/> of ${n.precip_type.charAt(0).toUpperCase() + n.precip_type.substr(1).toLowerCase()}`;
        }
        for (var i = 0; i < 7; i++) {
          let fc = forecasts[i+1];
          outlookHigh[i] = fc.max_temp;
          outlookLow[i] = fc.min_temp;
          outlookCondition[i] = (fc.day ? fc.day : fc.night).phrase_32char.split(' ').join('<br/>').replace("Thunderstorm", "Thunder</br>storm");
          outlookIcon[i] = (fc.day ? fc.day : fc.night).icon_code;
        }
        fetchRadarImages();
      });
    });
}

function fetchCurrentWeather(){
  let location = "";
  if(CONFIG.locationMode=="POSTAL") {location=`postalKey=${zipCode}:${CONFIG.countryCode}`}
  else if (CONFIG.locationMode=="AIRPORT") {
    let airportCodeLength=airportCode.length;
    if(airportCodeLength==3){location=`iataCode=${airportCode}`}
    else if (airportCodeLength==4){location=`icaoCode=${airportCode}`}
  }
  
  fetch(`https://api.weather.com/v3/location/point?${location}&language=${CONFIG.language}&format=json&apiKey=${CONFIG.secrets.twcAPIKey}`)
      .then(function (response) {
      response.json().then(function(data) {
        cityName = data.location.city.toUpperCase();
        latitude = data.location.latitude;
        longitude = data.location.longitude;
        fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/current.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
          .then(function(response) {
            response.json().then(function(data) {
              let unit = data.observation[CONFIG.unitField];
              currentTemperature = Math.round(unit.temp);
              currentCondition = data.observation.phrase_32char;
              windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} ${CONFIG.units === 'm' ? 'km/h' : 'mph'}`;
              gusts = unit.gust || 'NONE';
              feelsLike = unit.feels_like;
              
              // FIX: Ensure these are clean numbers for the "fast counting" aesthetics
              visibility = Number(unit.vis);
              humidity = Number(unit.rh);
              dewPoint = Number(unit.dewpt);
              
              pressure = unit.altimeter.toPrecision(4);
              let ptendCode = data.observation.ptend_code;
              pressureTrend = (ptendCode == 1 || ptendCode == 3) ? '▲' : ptendCode == 0 ? '' : '▼'; 
              currentIcon = data.observation.icon_code;
              fetchAlerts();
            });
          });
      });
    });
}

function fetchRadarImages(){
  var radarContainer = getElement('radar-container');
  if(radarContainer) radarContainer.innerHTML = "";
  
  var radarImage = document.createElement("iframe");
  var mapSettings = btoa(JSON.stringify({
    "agenda": { "id": "weather", "center": [longitude, latitude], "zoom": 8 },
    "animating": true, "base": "standard", "opacity": { "national": 0.6 }
  }));

  radarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);
  
  // Radar Cropping
  radarImage.style.width = "1600px";
  radarImage.style.height = "1000px";
  radarImage.style.marginTop = "-280px"; 
  radarImage.style.marginLeft = "-180px";
  radarImage.style.border = "none";
  
  if(radarContainer) radarContainer.appendChild(radarImage);

  if (!timelineStarted) {
    scheduleTimeline();
    timelineStarted = true;
  }
}

// 1-Minute Silent Refresh
setInterval(function() {
  fetchCurrentWeather();
}, 60000);
