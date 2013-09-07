var _ = require('underscore');
var commaseparated = require('./commaseparated.js');

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

var readCSV = commaseparated.cacher();

var find_open_restaurants = function(csv_filepath, dateObj) {
  readCSV(csv_filepath, function(restaurants){
    console.log(findOpenSpots(restaurants, dateObj));
  });
};


find_open_restaurants('./rest_hours.csv', new Date());

setTimeout(function(){
  find_open_restaurants('./rest_hours.csv', new Date());
}, 1000);
