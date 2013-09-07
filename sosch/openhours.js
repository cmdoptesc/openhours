var fs = require('fs');
var _ = require('underscore');
var Restaurant = require('./restaurant.js');

var parseCSV = function(csvData) {
  var restaurantsRaw = csvData.toString().split(/\r?\n/);
  var parsed = [];
  var restInfo, venue;

  _.each(restaurantsRaw, function(rest){
    if(rest.length > 0) {
      restInfo = rest.split(',"');
      venue = new Restaurant(restInfo[0], restInfo[1]);
      parsed.push(venue);
    }
  });

  return parsed;
};

  // caches CSV files so if the same filepath is called upon again
  //  it reads the cache as opposed to the file
var csvCacher = function() {
  var cache = {};

  return function(csv_filepath, callback) {
    if(typeof cache[csv_filepath] === 'undefined') {
      console.log('reading new csv file..');
      fs.readFile(csv_filepath, function (err, data) {
        if (err) { throw err; }
        else if(data) {
          cache[csv_filepath] = parseCSV(data);
          callback(cache[csv_filepath]);
        }
      });
    } else {
      console.log('using cache..');
      callback(cache[csv_filepath]);
    }
  };
};

  // find the open restaurants at a given time
var findOpenSpots = function(restaurants, dateObj) {
  var openSpots = [];

  _.each(restaurants, function(rest){
    if(rest.isOpen(dateObj)) {
      openSpots.push(rest.name);
    }
  });

  return openSpots;
};

var readCSV = csvCacher();

var find_open_restaurants = function(csv_filepath, dateObj) {
  readCSV(csv_filepath, function(restaurants){
    console.log(findOpenSpots(restaurants, dateObj));
  });
};


find_open_restaurants('./rest_hours.csv', new Date());

setTimeout(function(){
  find_open_restaurants('./rest_hours.csv', new Date());
}, 1000);
