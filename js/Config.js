window.CONFIG = {
  crawl: `The Weather Channel is Amercas #1 weather network. Trusted. Reliable. Accurate.         For more information on your weather switch to normal programming.`,
  greeting: 'Your watching WeatherNOW Manassas',
  language: 'en-US',
  countryCode: 'US',
  units: 'e', 
  unitField: 'imperial',
  loop: false,
  locationMode: "POSTAL",
  secrets: {
    twcAPIKey: 'e1f10a1e78da46f5b10a1e78da96f525'
  },

  locationOptions:[],
  addLocationOption: (id, name, desc) => {
    CONFIG.locationOptions.push({ id, name, desc })
  },
  options: [],
  addOption: (id, name, desc) => {
    CONFIG.options.push({ id, name, desc })
  },

  submit: (btn, e) => {
    let args = {}
    const currentLoop = (localStorage.getItem('loop') === 'y')
    
    // 1. Gather inputs from the settings screen
    CONFIG.locationOptions.forEach((opt) => {
      args[opt.id] = getElement(`${opt.id}-text`).value
      args[`${opt.id}-button`] = getElement(`${opt.id}-button`).checked
      if (!currentLoop) {
        localStorage.setItem(opt.id, args[opt.id])
      }
    })
    
    args['countryCode'] = getElement('country-code-text').value
    if (!currentLoop) {
      localStorage.setItem('countryCode', args['countryCode'])
    }

    CONFIG.options.forEach((opt) => {
      args[opt.id] = getElement(`${opt.id}-text`).value
      if (!currentLoop) {
        localStorage.setItem(opt.id, args[opt.id])
      }
    })

    // 2. Set the global location variables
    zipCode = args['zip-code'] || localStorage.getItem('zip-code');
    airportCode = args['airport-code'] || localStorage.getItem('airport-code');
    
    if (args['airport-code-button'] == true){ 
      CONFIG.locationMode = "AIRPORT";
    } else { 
      CONFIG.locationMode = "POSTAL";
    }
    
    // 3. Update the text on screen (Crawl/Greeting)
    if (currentLoop) {
      if (localStorage.getItem('crawlText')) CONFIG.crawl = localStorage.getItem('crawlText')
      if (localStorage.getItem('greetingText')) CONFIG.greeting = localStorage.getItem('greetingText')
    } else {
      if (args.crawlText !== '') CONFIG.crawl = args.crawlText
      if (args.greetingText !== '') CONFIG.greeting = args.greetingText
    }
    
    CONFIG.unitField = CONFIG.units === 'm' ? 'metric' : (CONFIG.units === 'h' ? 'uk_hybrid' : 'imperial');
    
    // 4. Initial Trigger
    fetchCurrentWeather();
  },

  load: () => {
    let settingsPrompt = getElement('settings-prompt')
    let advancedSettingsOptions = getElement('advanced-settings-options')

    CONFIG.options.forEach((option) => {
      let label = document.createElement('div')
      label.classList.add('strong-text', 'settings-item', 'settings-text', 'settings-padded')
      label.style.textAlign='left'
      label.appendChild(document.createTextNode(option.name))
      label.id = `${option.id}-label`

      let textbox = document.createElement('textarea')
      textbox.classList.add('settings-item', 'settings-text', 'settings-input')
      textbox.id = `${option.id}-text`
      if (localStorage.getItem(option.id)) textbox.value = localStorage.getItem(option.id)
      
      advancedSettingsOptions.appendChild(label)
      advancedSettingsOptions.appendChild(textbox)
    })

    let btn = document.createElement('button')
    btn.classList.add('setting-item', 'settings-text', 'settings-input', 'button')
    btn.id = 'submit-button'
    btn.onclick = CONFIG.submit
    btn.appendChild(document.createTextNode('Start'))
    settingsPrompt.appendChild(btn)

    if (CONFIG.loop || localStorage.getItem('loop') === 'y') {
      CONFIG.loop = true;
      hideSettings();
      CONFIG.submit()
    }
  }
}

// Ensure unit field is ready before any fetch
CONFIG.unitField = CONFIG.units === 'm' ? 'metric' : (CONFIG.units === 'h' ? 'uk_hybrid' : 'imperial');

// --- THE CONTINUOUS UPDATE LOOP ---
// This runs every 60 seconds. It only fires if the weather engine 
// is loaded and we have a location to search for.
setInterval(function() {
  if (typeof fetchCurrentWeather === "function" && (zipCode || airportCode)) {
    console.log("Auto-refreshing weather for: " + (zipCode || airportCode));
    fetchCurrentWeather();
  }
}, 60000); 
