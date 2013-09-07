var _ = require('underscore');
var helpers = require('./helpers.js');
var commaseparated = require('./commaseparated.js');

  // find and possibly the open restaurants at a given time
  //  printSpots is a boolean to print out the open spots
var showOpenSpots = function(restaurants, dateObj, printSpots) {
  var openSpots = [];
  var day = helpers.getDay(dateObj);

  _.each(restaurants, function(rest) {
    if(rest.isOpen(dateObj)) {
      if(printSpots) {
        console.log(rest.name +' (closes at '+ rest.schedule[day].close +')');
      }
      openSpots.push(rest);
    }
  });

  return openSpots;
};

var parseCSV = commaseparated.cacher();

var find_open_restaurants = function(csv_filepath, dateObj, callback) {
  parseCSV(csv_filepath, function(restaurants) {
    var openSpots = showOpenSpots(restaurants, dateObj, true);

    return (callback) ? callback(openSpots) : openSpots;
  });
};

module.exports = find_open_restaurants;

// find_open_restaurants('./rest_hours.csv', new Date());

//   // this is to demonstrate the caching.. need a setTimeout to give the server
//   //  some time to read and parse the CSV
// setTimeout(function(){
//   find_open_restaurants('./rest_hours.csv', new Date());
// }, 1000);