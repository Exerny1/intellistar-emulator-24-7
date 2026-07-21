var timelineStarted = false;

function guessZipCode(){
  return;
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

        const alertAudio = document.getElementById('alert-sound');
        if (alertAudio && data.features.length > 0) {
          const hasWarning = data.features.some(f =>
            f.properties.event.toUpperCase().includes("WARNING")
          );
          if (hasWarning) {
  alertAudio.play().catch(e => console.log("Audio interaction required"));
  
  // ⚠️ SEVERE WARNING MODE: Deep Crimson/Maroon Gradient
  document.documentElement.style.setProperty('--bg-top', '#2b0b0b');
  document.documentElement.style.setProperty('--bg-bottom', '#0f0505');
} else {
  // 🔵 NORMAL MODE: Dark Steel Blue Gradient
  document.documentElement.style.setProperty('--bg-top', '#1e2732');
  document.documentElement.style.setProperty('--bg-bottom', '#0a0d11');
}


        if (data.features.length == 1) {
          alerts[0] = data.features[0].properties.event + '<br>' +
            data.features[0].properties.description.replace("..."," ").replace(/\*/g, "");

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
        let forecasts = data.forecasts;
        isDay = forecasts[0].day;

        let ns = [];
        ns.push(forecasts[0].day || forecasts[0].night);
        ns.push(forecasts[0].night);
        ns.push(forecasts[1].day);
        ns.push(forecasts[1].night);

        for (let i = 0; i <= 3; i++) {
          let n = ns[i];
          forecastTemp[i] = n.temp;
          forecastIcon[i] = n.icon_code;
          forecastNarrative[i] = n.narrative;
          forecastPrecip[i] =
            `${n.pop}% Chance<br/> of ${n.precip_type.charAt(0).toUpperCase() + n.precip_type.substr(1).toLowerCase()}`;
        }

        for (var i = 0; i < 7; i++) {
          let fc = forecasts[i+1];
          outlookHigh[i] = fc.max_temp;
          outlookLow[i] = fc.min_temp;
          outlookCondition[i] =
            (fc.day ? fc.day : fc.night).phrase_32char
              .split(' ')
              .join('<br/>')
              .replace("Thunderstorm", "Thunder</br>storm");

          outlookIcon[i] = (fc.day ? fc.day : fc.night).icon_code;
        }

        fetchRadarImages();
      });
    });
}

function fetchCurrentWeather(){
  let location = "";
  if(CONFIG.locationMode=="POSTAL") {
    location=`postalKey=${zipCode}:${CONFIG.countryCode}`;
  }
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
            if (response.status !== 200) {
              console.log("conditions request error");
              return;
            }

            response.json().then(function(data) {
              let unit = data.observation[CONFIG.unitField];

              currentTemperature = Math.round(unit.temp);
              currentCondition = data.observation.phrase_32char;
              windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} ${CONFIG.units === 'm' ? 'km/h' : 'mph'}`;
              gusts = unit.gust || 'NONE';
              feelsLike = unit.feels_like;
              visibility = Math.round(unit.vis);
              humidity = unit.rh;
              dewPoint = unit.dewpt;
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

  radarImage = document.createElement("iframe");

  radarImage.onerror = function () {
    getElement('radar-container').style.display = 'none';
  }

  mapSettings = btoa(JSON.stringify({
    "agenda": {
      "id": "weather",
      "center": [longitude, latitude],
      "location": null,
      "zoom": 8
    },
    "animating": true,
    "base": "standard",
    "artcc": false,
    "county": false,
    "cwa": false,
    "rfc": false,
    "state": false,
    "menu": false,
    "shortFusedOnly": false,
    "opacity": {
      "alerts": 0.0,
      "local": 0.0,
      "localStations": 0.0,
      "national": 0.6
    }
  }));

  radarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);

  radarImage.style.width = "1230px";
  radarImage.style.height = "740px";
  radarImage.style.marginTop = "-220px";
  radarImage.style.overflow = "hidden";
  radarImage.style.border = "none";

  if(radarContainer) radarImage.appendChild(radarImage);

  if(alertsActive){
    var zoomedContainer = getElement('zoomed-radar-container');
    if(zoomedContainer) zoomedContainer.innerHTML = "";

    zoomedRadarImage = document.createElement("iframe");

    zoomedRadarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings);

    zoomedRadarImage.style.width = "1230px";
    zoomedRadarImage.style.height = "740px";

    if(zoomedContainer) zoomedContainer.appendChild(zoomedRadarImage);
  }

  /* ORIGINAL START CONDITION (UNCHANGED LOGIC) */
  if (!timelineStarted) {
    scheduleTimeline();
    timelineStarted = true;
  }
}

/* =======================
   🔧 FIX: SAFETY START
   (ONLY ADDITION, NO CHANGES ABOVE)
   ======================= */

function ensureTimelineStarts() {
  if (timelineStarted) return;

  console.warn("Failsafe: forcing timeline start");
  timelineStarted = true;

  if (typeof scheduleTimeline === "function") {
    scheduleTimeline();
  }
}

setTimeout(ensureTimelineStarts, 8000);

/* AUTO REFRESH (UNCHANGED) */
setInterval(function() {
  fetchCurrentWeather();
}, 60000);