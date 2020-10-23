-- once done writing table in terminal line write command 
-- psql -f schema.sql -d cityexplorer just press enter on this 
-- i should see things "coundet find table" "DROP TABLE" "CREATE TABLE"
--good to see this 


DROP TABLE IF EXISTS location;
CREATE TABLE location (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT,
  formatted_query VARCHAR(255)
);

DROP TABLE IF EXISTS weather;
CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  forecast VARCHAR(255),
  time DATE
);

DROP TABLE IF EXISTS trails;
CREATE TABLE trails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  length FLOAT, 
  stars FLOAT,
  star_votes INT,
  summary VARCHAR(255),
  trail_url VARCHAR(255),
  conditions VARCHAR(255),
  condition_date DATE,
  condition_time TIME
);
