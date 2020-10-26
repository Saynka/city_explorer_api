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
app.get('/yelp', yelpHandler);
app.get('/movies', moviehandler);
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
  const URL = `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATIONIQ_API_KEY}&q=${city}&format=json`;
  let SQL = 'SELECT * FROM location WHERE search_query LIKE ($1);';
  let safeValue = [city];

  client.query(SQL, safeValue)
    .then(SQL => {
      if (SQL.rowCount) {
        res.status(200).send(SQL.rows[0]);
      } else {
        superagent.get(URL)
          .then(data => {
            let location = new Location(city, data.body[0]);
            let sql = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            let safeValue = [location.search_query, location.formatted_query, location.latitude, location.longitude];
            client.query(sql, safeValue);
            res.status(200).send(location);
          });

      }
    }).catch((error) => {
      console.log('error', error);
      res.status(500).send('Your API call did not work?');
    });
}



// working///////////////////////yelp function 
function yelpHandler(req, res) {

  const numPerPage = 2;
  const page = req.query.search_query || 1;
  const start = ((page - 1) * numPerPage + 1);

  const url = 'https://api.yelp.com/v3/businesses/search';

  const queryParams = {
    latitude: req.query.latitude,
    start: start,
    count: numPerPage,
    longitude: req.query.longitude,
  };

  // console.log(queryParams);

  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.API_KEY}`)
    .query(queryParams)
    .then((data) => {
      const results = data.body.businesses;
      const restaurantData = [];
      results.forEach(entry => {
        restaurantData.push(new Restaurant(entry));
        console.log(entry);
      });
      res.send(restaurantData);
    })
    .catch((error) => {
      console.log('ERROR', error);
      res.status(500).send('So sorry, something went wrong.');
    });

}


///////////////////////  places function
function moviehandler(req, res) {

  let city = req.query.search_query;
  let tok4 = process.env.MOVIE_API_KEY;
  const url = `https://api.themoviedb.org/3/search/movie/?api_key=${tok4}&query=${city}`;

  const queryParams = {
    access_token: process.env.MOVIE_API_KEY,
    types: 'poi',
    limit: 10,
  };

  superagent.get(url)
    .query(queryParams)
    .then((results) => {
      let searchMovie = results.body.results.map(movies => {
        let newerMovies = new Place(movies)
        return newerMovies;
      })
      res.status(200).send(searchMovie);
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
    .catch((error) => res.status(500).send('So sorry, something went wrong.'));
}

/////////////////////// Constructors

function Location(city, locationData) {
  this.search_query = city;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
  this.formatted_query = locationData.display_name;
}

function Restaurant(obj) {
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}

function Place(obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popluarity;
  this.released_on = obj.release_date;
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
