// variables globale
let cityInput = document.getElementById("city_input"),
    searchBtn = document.getElementById("searchBtn"),
    locationBtn = document.getElementById("locationBtn"),
    savedCitiesList = document.getElementById("saved-cities"),
    api_key = "53bc8f8c5c096f9fee2036f391eb34e7",
    currentWeatherCard = document.querySelector(".weather-left .card"),
    fiveDaysForcast = document.querySelector(".day-forecast"),
    aqiCard = document.querySelectorAll(".highlights .card")[0],
    sunriseCard = document.querySelectorAll(".highlights .card")[1],
    humidityVal = document.getElementById("humidityVal"),
    PressureVal = document.getElementById("PressureVal"),
    VisibilityVal = document.getElementById("VisibilityVal"),
    WindSpeedVal = document.getElementById("WindSpeedVal"),
    FeelsVal = document.getElementById("FeelsVal"),
    hourlyForcastCard = document.querySelector(".hourly-forecast"),
    aqiList = ["Good", "Fair", "Moderate", "Poor", "Very Poor"],
    savedCities = JSON.parse(localStorage.getItem("savedCities")) || [];

//  API : recuperer les donnees d'une ville 
function getCityCoordinates(cityName = null) {
  if (!cityName) {
    cityName = cityInput.value.trim();
    cityInput.value = "";
  }
  if (!cityName) return;

  const GEO_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;

  fetch(GEO_URL)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        alert(`No data found for ${cityName}`);
        return;
      }
      const { name, lat, lon, country, state } = data[0];
      getWeatherDetails(name, lat, lon, country, state);
      addcity(name);
    })
    .catch(() => alert("Failed to fetch coordinates of " + cityName));
}

//  API : localisation actuelle
function getUserCoordinates() {
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    const REVERSE_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${api_key}`;

    fetch(REVERSE_URL)
      .then(res => res.json())
      .then(data => {
        const { name, country, state } = data[0];
        getWeatherDetails(name, latitude, longitude, country, state);
        addcity(name);
      })
      .catch(() => alert("Failed to fetch user coordinates"));
  });
}

//  API : meteo
function getWeatherDetails(name, lat, lon, country, state) {
  const FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}`;
  const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`;
  const AIR_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  fetch(AIR_URL)
    .then(res => res.json())
    .then(data => {
      const { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = data.list[0].components;
      aqiCard.innerHTML = `
        <div class="card-head">
          <p>Air Quality index</p>
          <p class="air-index aqi-${data.list[0].main.aqi}">${aqiList[data.list[0].main.aqi - 1]}</p>
        </div>
        <div class="air-indices">
          <i class="fa-regular fa-wind fa-3x"></i>
          <div class="item"><p>PM2.5</p><h2>${pm2_5}</h2></div>
          <div class="item"><p>PM10</p><h2>${pm10}</h2></div>
          <div class="item"><p>SO2</p><h2>${so2}</h2></div>
          <div class="item"><p>CO</p><h2>${co}</h2></div>
          <div class="item"><p>NO</p><h2>${no}</h2></div>
          <div class="item"><p>NO2</p><h2>${no2}</h2></div>
          <div class="item"><p>NH3</p><h2>${nh3}</h2></div>
          <div class="item"><p>O3</p><h2>${o3}</h2></div>
        </div>`;
    });

  fetch(WEATHER_URL)
    .then(res => res.json())
    .then(data => {
      const date = new Date();
      const { sunrise, sunset } = data.sys;
      const { timezone, visibility } = data;
      const { humidity, pressure, feels_like } = data.main;
      const { speed } = data.wind;
      const sRiseTime = moment.unix(sunrise).add(timezone / 60, "minutes").format("HH:mm A");
      const sSetTime = moment.unix(sunset).add(timezone / 60, "minutes").format("HH:mm A");

      currentWeatherCard.innerHTML = `
        <div class="current-weather">
          <div class="details">
            <p>Now</p>
            <h2>${(data.main.temp - 273.15).toFixed(2)}&deg;C</h2>
            <p>${data.weather[0].description}</p>
          </div>
          <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="" />
          </div>
        </div>
        <hr id="short-line" />
        <div class="card-footer">
          <p><i class="fa-light fa-calendar"></i>${days[date.getDay()]}, ${months[date.getMonth()]}, ${date.getFullYear()}</p>
          <p><i class="fa-light fa-location-dot"></i>${name}, ${country}</p>
        </div>`;

      sunriseCard.innerHTML = `
        <div class="card-head"><p>Sunrise & Sunset</p></div>
        <div class="sunrise-sunset">
          <div class="item">
            <div class="icon"><i class="fa-light fa-sunrise fa-4x"></i></div>
            <div><p>Sunrise</p><h2>${sRiseTime}</h2></div>
          </div>
          <div class="item">
            <div class="icon"><i class="fa-light fa-sunset fa-4x"></i></div>
            <div><p>Sunset</p><h2>${sSetTime}</h2></div>
          </div>
        </div>`;

      humidityVal.innerHTML = `${humidity}%`;
      PressureVal.innerHTML = `${pressure}hPa`;
      VisibilityVal.innerHTML = `${visibility / 1000}Km`;
      WindSpeedVal.innerHTML = `${speed}m/s`;
      FeelsVal.innerHTML = `${(feels_like - 275.15).toFixed(2)}&deg;C`;
    });

  fetch(FORECAST_URL)
    .then(res => res.json())
    .then(data => {
      hourlyForcastCard.innerHTML = "";
      for (let i = 0; i <= 7; i++) {
        const hrDate = new Date(data.list[i].dt_txt);
        let hr = hrDate.getHours();
        let a = hr < 12 ? "AM" : "PM";
        hr = hr % 12 || 12;
        hourlyForcastCard.innerHTML += `
          <div class="card">
            <p>${hr} ${a}</p>
            <img src="https://openweathermap.org/img/wn/${data.list[i].weather[0].icon}.png" alt="" />
            <p>${(data.list[i].main.temp - 273.15).toFixed(2)}&deg;C</p>
          </div>`;
      }

      let uniqueDays = [];
      let fiveDays = data.list.filter(f => {
        let d = new Date(f.dt_txt).getDate();
        if (!uniqueDays.includes(d)) {
          uniqueDays.push(d);
          return true;
        }
        return false;
      });

      fiveDaysForcast.innerHTML = "";
      fiveDays.forEach(f => {
        let date = new Date(f.dt_txt);
        fiveDaysForcast.innerHTML += `
          <div class="forecast-item">
            <div class="icon-wrapper">
              <img src="https://openweathermap.org/img/wn/${f.weather[0].icon}.png" alt="" />
              <span>${(f.main.temp - 273.15).toFixed(2)}&deg;C</span>
              <p>${date.getDate()} ${months[date.getMonth()]}</p>
              <p>${days[date.getDay()]}</p>
            </div>
          </div>`;
      });
    });
}

// crud des villes sauvegardes
function addcity(ville) {
  if (ville && !savedCities.includes(ville)) {
    savedCities.push(ville);
    saveLocalStorage();
    showCitys();
  }
}

function showCitys() {
  savedCitiesList.innerHTML = "";
  for (let i = 0; i < savedCities.length; i++) {
    let ville = savedCities[i];
    let div = document.createElement("div");
    div.className = "saved-city-item";
    div.innerHTML = `
      <span>${ville}</span>
      <div class="saved-city-actions">
        <button class="view-city"  title="Voir" data-ville="${ville}"><i class="fa fa-eye"></i></button>
        <button class="edit-city" title="Modifier" data-ville="${ville}"><i class="fa fa-pen"></i></button>
        <button class="delete-city" title="Supprimer" data-ville="${ville}"><i class="fa fa-trash"></i></button>
      </div>`;
    savedCitiesList.appendChild(div);
  }
  activateEvent();
}

function updateCity(villeActuelle) {
  let nouvelleVille = prompt("Modifier le nom de la ville :", villeActuelle);
  if (nouvelleVille && !savedCities.includes(nouvelleVille)) {
    let index = savedCities.indexOf(villeActuelle);
    if (index !== -1) {
      savedCities[index] = nouvelleVille;
      saveLocalStorage();
      showCitys();
    }
  }
}

function deleteCity(nom) {
  let index = savedCities.indexOf(nom);
  if (index !== -1) {
    savedCities.splice(index, 1);
    saveLocalStorage();
    showCitys();
  }
}

function saveLocalStorage() {
  localStorage.setItem("savedCities", JSON.stringify(savedCities));
}

function chargeFromLocalStorage() {
  let data = localStorage.getItem("savedCities");
  if (data) {
    savedCities = JSON.parse(data);
  }
  showCitys();
}

function activateEvent() {
  document.querySelectorAll(".view-city").forEach(btn => {
    btn.addEventListener("click", e => {
      let ville = e.currentTarget.dataset.ville;
      getCityCoordinates(ville);
    });
  });

  document.querySelectorAll(".edit-city").forEach(btn => {
    btn.addEventListener("click", e => {
      let ville = e.currentTarget.dataset.ville;
      updateCity(ville);
    });
  });

  document.querySelectorAll(".delete-city").forEach(btn => {
    btn.addEventListener("click", e => {
      let ville = e.currentTarget.dataset.ville;
      deleteCity(ville);
    });
  });
}

// evenements init
searchBtn.addEventListener("click", () => getCityCoordinates());
locationBtn.addEventListener("click", getUserCoordinates);

window.addEventListener("DOMContentLoaded", () => {
  chargeFromLocalStorage();
  if (savedCities.length > 0) getCityCoordinates(savedCities[0]);
});
