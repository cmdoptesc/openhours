var fs = require('fs');
var _ = require('underscore');
var Restaurant = require('./restaurant.js');

var commaseparated = {
    // parses CSV data line by line and creates a restaurant object from each line
    //  then returns an array of restaurant objects
  parser: function(csvData) {
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
  },

    // caches CSV files so if the same filepath is called upon again
    //  it reads the parsed object from the cache as opposed to the file
  cacher: function() {
    var cache = {};

    return function(csv_filepath, callback) {
      if(typeof cache[csv_filepath] === 'undefined') {
        console.log('reading new csv file..');
        fs.readFile(csv_filepath, function (err, data) {
          if (err) { throw err; }
          else if(data) {
            cache[csv_filepath] = commaseparated.parser(data);
            callback(cache[csv_filepath]);
          }
        });
      } else {
        console.log('using cache..');
        callback(cache[csv_filepath]);
      }
    };
  }
};

module.exports = commaseparated;