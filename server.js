'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

//  API Route Definitions
app.get('/location', locationHandler);
app.get('/restaurants', restaurantHandler);
app.get('/places', placesHandler);
app.get('/weather', handleWeather);
app.get('/trails', trailHandler);
app.use('*', notFoundHandler);


app.get('/', (req, res) => {

  res.send('Home Page!');
});

app.get('/bad', (req, res) => {
  throw new Error('poo');
});

// The callback can be a separate function. Really makes things readable
app.get('/about', aboutUsHandler);

function aboutUsHandler(req, res) {
  res.status(200).send('About Us Page');
}

// HELPER FUNCTIONS

//
// Route handlers
//location function=working
function locationHandler(req, res) {
  let city = req.query.city;
  let key = process.env.LOCATIONIQ_API_KEY;

  const URL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

  superagent.get(URL)
    .then(data => {
      let location = new Location(city, data.body[0]);
      res.status(200).json(location);
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).send('Your API call did not work?');
    });
}

function notFoundHandler(req, res) {
  res.status(404).send('Try again.');
}

// Constructors
function Location(city, locationData) {
  this.search_query = city;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
  this.formatted_query = locationData.display_name;
}

// restaurant function "yelp not zomato"
function restaurantHandler(req, res) {

  const url = 'https://developers.zomato.com/api/v2.1/geocode';
  const queryParams = {
    lat: req.query.latitude,
    lng: req.query.longitude,
  };

  superagent.get(url)
    .set('user-key', process.env.ZOMATO_API_KEY)
    .query(queryParams)
    .then((data) => {
      const results = data.body;
      const restaurantData = [];
      results.nearby_restaurants.forEach(entry => {
        restaurantData.push(new Restaurant(entry));
      });
      res.send(restaurantData);
    })
    .catch(() => {
      console.log('ERROR', error);
      res.status(500).send('So sorry, something went wrong.');
    });

}

function Restaurant(entry) {
  this.restaurant = entry.restaurant.name;
  this.cuisines = entry.restaurant.cuisines;
  this.locality = entry.restaurant.location.locality;
}

// places function
function placesHandler(req, res) {

  const lat = req.query.latitude;
  const lng = req.query.longitude;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;

  const queryParams = {
    access_token: process.env.MAPBOX_API_KEY,
    types: 'poi',
    limit: 10,
  };

  superagent.get(url)
    .query(queryParams)
    .then((data) => {
      const results = data.body;
      const places = [];
      results.features.forEach(entry => {
        places.push(new Place(entry));
      });
      res.send(places);
    })
    .catch((error) => {
      console.log('ERROR', error);
      res.status(500).send('So sorry, something went wrong.');
    });
}

function Place(data) {
  this.name = data.text;
  this.type = data.properties.category;
  this.address = data.place_name;
}

// weather function=working
function handleWeather(req, res) {
  try {
    const data = require('./data/weather.json');
    const weatherData = [];
    data.data.forEach(entry => {
      weatherData.push(new Weather(entry));
    });
    res.send(weatherData);
  }
  catch (error) {
    console.log('ERROR', error);
    res.status(500).send('So sorry, something went wrong.');
  }

  let forcast = req.query.forcast;
  let key = process.env.WEATHER;

  const URL = `http://api.weatherbit.io/v2.0/current?key=${key}&q=${forcast}&format=json`;

  superagent.get(URL)
    .then(data => {
      let location = new Location(forcast, data.body[0]);
      res.status(200).json(location);
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).send('Your API call did not work?');
    });
}


function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = new Date(obj.valid_date).toDateString();
}

// trail function=working
function trailHandler(req, res) {
  let lat = req.query.latitude;
  let lon = req.query.longitude;
  let key = process.env.HIKING;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${key}`;

  superagent.get(url)
    .then(hike => {
      const hikingData = hike.body.trails;
      const trailData = hikingData.map(active => new Hiking(active));
      res.send(trailData);
    });
    .catch(() => response.status(500).send('So sorry, something went wrong.'));
}

function notFoundHandler(req, res) {
  res.status(404).send('Try again.');
}
function Hiking(active) {
  this.name = active.name;
  this.location = active.location;
  this.length = active.length;
  this.stars = active.stars;
  this.star_votes = active.starVotes;
  this.summary = active.summary;
  this.trail_url = active.url;
  this.conditions = active.conditionDetails;
  this.condition_date = active.conditionDate.slice(0, 9);
  this.condition_time = active.conditionDate.slice(11, 19);
}





// Make sure the server is listening for reqs
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
