var _ = require('underscore');
var helpers = require('./helpers.js');
var commaseparated = require('./commaseparated.js');

  // find the open restaurants at a given time
var findOpenSpots = function(restaurants, dateObj) {
  var openSpots = [];
  var day = helpers.getDay(dateObj);

  _.each(restaurants, function(rest) {
    if(rest.isOpen(dateObj)) {
      var spot = {
        name: rest.name,
        close: rest.schedule[day].close
      };
      openSpots.push(spot);
    }
  });

  return openSpots;
};

var parseCSV = commaseparated.cacher();

var find_open_restaurants = function(csv_filepath, dateObj) {
  parseCSV(csv_filepath, function(restaurants) {
    var openSpots = findOpenSpots(restaurants, dateObj);

    _.each(openSpots, function(spot) {
      console.log(spot.name +' (closes at '+ spot.close +')');
    });
  });
};

module.exports = find_open_restaurants;

find_open_restaurants('./rest_hours.csv', new Date());

  // this is to demonstrate the caching.. need a setTimeout to give the server
  //  some time to read and parse the CSV
setTimeout(function(){
  find_open_restaurants('./rest_hours.csv', new Date());
}, 1000);