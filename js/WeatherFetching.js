// Configuration for the Weather API (NOAA/NWS)
const API_URL = "https://api.weather.gov/points/";

async function getWeatherData(lat, lon) {
    try {
        // 1. Get the local grid points for the coordinates
        const pointsResponse = await fetch(`${API_URL}${lat},${lon}`);
        const pointsData = await pointsResponse.json();
        
        // 2. Extract the forecast and observation URLs
        const forecastUrl = pointsData.properties.forecast;
        const observationStationUrl = pointsData.properties.observationStations;

        // 3. Get the nearest station for "Current Conditions"
        const stationResponse = await fetch(observationStationUrl);
        const stationData = await stationResponse.json();
        const latestObservationUrl = `${stationData.features[0].id}/observations/latest`;

        // 4. Fetch the actual Weather Data
        const [forecastRes, currentRes] = await Promise.all([
            fetch(forecastUrl).then(res => res.json()),
            fetch(latestObservationUrl).then(res => res.json())
        ]);

        const current = currentRes.properties;
        const today = forecastRes.properties.periods[0];

        // 5. Package the data for the UI
        return {
            temp: Math.round(current.temperature.value * 9/5 + 32) || "--",
            condition: today.shortForecast,
            high: today.temperature,
            wind: `${current.windDirection.value}° at ${Math.round(current.windSpeed.value * 0.621371)} mph`,
            humidity: Math.round(current.relativeHumidity.value) + "%",
            icon: today.icon
        };

    } catch (error) {
        console.error("Error fetching weather:", error);
        return null;
    }
}

// Function to update the HTML elements
function updateDisplay(data) {
    if (!data) return;

    // Matches the IDs typically found in these emulators
    const tempElement = document.getElementById("current-temp");
    const condElement = document.getElementById("current-condition");
    
    if (tempElement) tempElement.innerText = data.temp + "°";
    if (condElement) condElement.innerText = data.condition;
    
    // Trigger the box animation once data is loaded
    document.getElementById("content-container").classList.add("shown");
}

// Example usage: 
// getWeatherData(38.83, -77.43).then(data => updateDisplay(data));
