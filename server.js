'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
// super fancy error call
client.on('error', err => console.error(err));


// Application Setup
const PORT = process.env.PORT || 3000;

// Start express
const app = express();

// use CORS
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

// working///////////////////////location function
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


///////////////////////  restaurant function "yelp not zomato"
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


///////////////////////  places function
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

function notFoundHandler(req, res) {
  res.status(404).send('Try again.');
}


// working///////////////////////  weather function
function handleWeather(req, res) {
  let key = process.env.WEATHER;
  let forcast = req.query.search_query;

  const URL = `http://api.weatherbit.io/v2.0/forecast/daily?city=${forcast}&country=us&days=8&key=${key}`;

  superagent.get(URL)
    .then(data => {
      let weathercon = data.body.data.map(entry => new Weather(entry));
      console.log(weathercon);
      res.send(weathercon);
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).send('Your API call did not work?');
    });
}

// working///////////////////////  trail function
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
    })
    .catch((error) => response.status(500).send('So sorry, something went wrong.'));
}

/////////////////////// Constructors

function Location(city, locationData) {
  this.search_query = city;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
  this.formatted_query = locationData.display_name;
}

function Restaurant(entry) {
  this.restaurant = entry.restaurant.name;
  this.cuisines = entry.restaurant.cuisines;
  this.locality = entry.restaurant.location.locality;
}

function Place(data) {
  this.name = data.text;
  this.type = data.properties.category;
  this.address = data.place_name;
}

function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = new Date(obj.valid_date).toDateString();
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


function notFoundHandler(req, res) {
  res.status(404).send('Try again.');
}



// Make sure the server is listening for reqs
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
  });
