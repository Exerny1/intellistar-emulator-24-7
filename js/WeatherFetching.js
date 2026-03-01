function guessZipCode(){
  return;
  var zipCodeElement = getElement("zip-code-text");
  if(zipCodeElement.value != ""){
    return;
  }

  fetch(`https://api.wunderground.com/api/${CONFIG.secrets.wundergroundAPIKey}/geolookup/q/autoip.json`)
    .then(function(response) {
      if (response.status !== 200) {
        console.log("zip code request error");
        return;
      }
      response.json().then(function(data) {
        if(zipCodeElement.value == ""){
          zipCodeElement.value = data.location.zip;
        }
      });
    })
}

function fetchAlerts(){
  var alertCrawl = "";
  fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`)
    .then(function(response) {
        if (response.status !== 200) {
            console.warn("Alerts Error, no alerts will be shown");
        }
      response.json().then(function(data) {
        if (data.features == undefined){
          fetchForecast();
          return;
        }
        if (data.features.length == 1) {
          alerts[0] = data.features[0].properties.event + '<br>' + data.features[0].properties.description.replace("..."," ").replace(/\*/g, "")
          for(var i = 0; i < data.features.length; i++){
            alertCrawl = alertCrawl + " " + data.features[i].properties.description.replace("...", " ");
          }
        }
        else {
          for(var i = 0; i < data.features.length; i++){
            alertCrawl = alertCrawl + " " + data.features[i].properties.description.replace("...", " ");
            alerts[i] = data.features[i].properties.event
          }
        }
        if(alertCrawl != ""){
          CONFIG.crawl = alertCrawl;
        }
        alertsActive = alerts.length > 0;
        fetchForecast();
      });
    })
}

function fetchForecast(){
  fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/forecast/daily/10day.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
    .then(function(response) {
      if (response.status !== 200) {
        console.log('forecast request error');
        return;
      }
      response.json().then(function(data) {
        let forecasts = data.forecasts
        isDay = forecasts[0].day; 
        let ns = []
        ns.push(forecasts[0].day || forecasts[0].night);
        ns.push(forecasts[0].night);
        ns.push(forecasts[1].day);
        ns.push(forecasts[1].night);
        for (let i = 0; i <= 3; i++) {
          let n = ns[i]
          forecastTemp[i] = n.temp
          forecastIcon[i] = n.icon_code
          forecastNarrative[i] = n.narrative
          forecastPrecip[i] = `${n.pop}% Chance<br/> of ${n.precip_type.charAt(0).toUpperCase() + n.precip_type.substr(1).toLowerCase()}`
        }
        for (var i = 0; i < 7; i++) {
          let fc = forecasts[i+1]
          outlookHigh[i] = fc.max_temp
          outlookLow[i] = fc.min_temp
          outlookCondition[i] = (fc.day ? fc.day : fc.night).phrase_32char.split(' ').join('<br/>')
          outlookCondition[i] = outlookCondition[i].replace("Thunderstorm", "Thunder</br>storm");
          outlookIcon[i] = (fc.day ? fc.day : fc.night).icon_code
        }
        fetchRadarImages();
      })
    })
}

function fetchCurrentWeather(){
  let location = "";
  if(CONFIG.locationMode=="POSTAL") {location=`postalKey=${zipCode}:${CONFIG.countryCode}`}
  else if (CONFIG.locationMode=="AIRPORT") {
    let airportCodeLength=airportCode.length;
    if(airportCodeLength==3){location=`iataCode=${airportCode}`}
    else if (airportCodeLength==4){location=`icaoCode=${airportCode}`}
    else {
      return;
    }
  }
  else {
    return;
  }
  
  fetch(`https://api.weather.com/v3/location/point?${location}&language=${CONFIG.language}&format=json&apiKey=${CONFIG.secrets.twcAPIKey}`)
      .then(function (response) {
          if (response.status !== 200) {
              return;
          }
      response.json().then(function(data) {
        try {
          if(CONFIG.locationMode=="AIRPORT"){
            cityName = data.location.airportName.toUpperCase().replace("INTERNATIONAL","INTL.").replace("AIRPORT","").trim();
          } else {
            cityName = data.location.city.toUpperCase();
          }
          latitude = data.location.latitude;
          longitude = data.location.longitude;
        } catch (err) {
          console.error(err)
          return;
        }
        fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/current.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
          .then(function(response) {
            if (response.status !== 200) {
              return;
            }
            response.json().then(function(data) {
              let unit = data.observation[CONFIG.unitField];
              currentTemperature = Math.round(unit.temp);
              currentCondition = data.observation.phrase_32char;
              windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} ${CONFIG.units === 'm' ? 'km/h' : 'mph'}`;
              gusts = unit.gust || 'NONE';
              feelsLike = unit.feels_like
              visibility = Math.round(unit.vis)
              humidity = unit.rh
              dewPoint = unit.dewpt
              pressure = unit.altimeter.toPrecision(4);
              let ptendCode = data.observation.ptend_code
              pressureTrend = (ptendCode == 1 || ptendCode == 3) ? '▲' : ptendCode == 0 ? '' : '▼'; 
              currentIcon = data.observation.icon_code
              fetchAlerts();
            });
          });
      })
    });
}

function fetchRadarImages(){
  // Silent update for radar: only creates iframe if it doesn't exist
  var radarContainer = document.getElementById('radar-container');
  if (!radarContainer) return;

  radarContainer.innerHTML = ""; 
  radarImage = document.createElement("iframe");
  
  mapSettings = btoa(JSON.stringify({
    "agenda": { "id": "weather", "center": [longitude, latitude], "location": null, "zoom": 8 },
    "animating": true, "base": "standard", "opacity": { "alerts": 0.0, "local": 0.0, "localStations": 0.0, "national": 0.6 }
  }));

  radarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);
  radarImage.style.width = "1230px";
  radarImage.style.height = "740px";
  radarImage.style.marginTop = "-220px";
  radarImage.style.overflow = "hidden";
  radarContainer.appendChild(radarImage);

  // NOTE: scheduleTimeline() REMOVED FROM HERE TO PREVENT OVERLAPPING
}

/**
 * INITIAL STARTUP
 */
fetchCurrentWeather();

// Wait 5 seconds for the first fetch to finish, then start the timeline once.
setTimeout(function() {
    if (typeof scheduleTimeline === "function") {
        scheduleTimeline();
    }
}, 5000);

/**
 * THE REFRESH TIMER (1 MINUTE)
 */
setInterval(function() {
    console.log("Minute reached: Updating weather variables in background...");
    fetchCurrentWeather();
}, 60000); 
