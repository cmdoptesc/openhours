var fs = require('fs');
var _ = require('underscore');

// formerly helpers.js

var helpers = {
    // given a start day and end day,
    // return an array of all the days between them, inclusive
  rangeToDays: function(startDay, endDay) {
    var week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var days = [];

    var i, open = false;
      // loops twice just in case of a Sun-Thu schedule
    for(i=0; i<week.length*2; i++) {
      if(week[i%7] === startDay) { open = true; }
      if(open) { days.push(week[i%7]); }
      if(week[i%7] === endDay && open === true) { break; }
    }

    return days;
  },

    // converts time from 12-hour string into a 24-hr decimal
    //  midnight on the dot is treated as 24, but 12:15am is 0.25
  to24Hr: function(twelveHour) {
    var hoursRegex = /\d*/;
    var eveningRegex = /pm/i;

    var time = twelveHour.split(':');
    var hours = parseInt(hoursRegex.exec(time[0])[0], 10);

    if(eveningRegex.test(twelveHour) && hours < 12) {
      hours += 12;
    } else if (!eveningRegex.test(twelveHour) && hours === 12) {
      if(!time[1] || parseInt(time[1], 10) === 0) {
        hours = 24;
      } else {
        hours -= 12;
      }
    }

    if(time[1]) {
      hours += parseInt(time[1], 10)/60;
    }

    return hours;
  },

    // takes the raw times portion of the CSV and parses it to a object
    // in the format of:
    /*    days = {
            Mon: {
              open: 11,
              close: 23
            },
            Tue: {
              open: 11,
              close: 23
            }
          }
    */
    // times are stored in 24 format
  parseRawHours: function(rawHours) {
    var days = {};

    var schedules = rawHours.split('/');
    _.each(schedules, function(schedule) {
      schedule = schedule.trim();

      var openDays = [];     // array of days sharing the same schedule

      var dayRangeRegex = /[a-z]{3}-[a-z]{3}/i;
      if(schedule.match(dayRangeRegex) && schedule.match(dayRangeRegex).length > 0) {
        var dayRange = schedule.match(dayRangeRegex)[0].split('-');
        openDays = helpers.rangeToDays(dayRange[0], dayRange[1]);
      }

      var singleDaysRegex = /([a-zA-Z]{3})/g;
      var singleDays = schedule.match(singleDaysRegex);

      _.each(singleDays, function(day) {
        openDays.push(day);
      });

      var hoursRegex = /\d*:*\d+ [ap]m - \d*:*\d+ [ap]m/;
      var openclose = schedule.match(hoursRegex)[0].split(' - ');

      _.each(openDays, function(day){
        days[day] = {};
        days[day].open = helpers.to24Hr(openclose[0]);
        days[day].close = helpers.to24Hr(openclose[1]);
      });
    });

    return days;
  },

    // since the schedule considers early morning hours as the previous
    //  day, I've set 5am as the cutoff. times between midnight and 5am
    //  will reference the previous day's schedule
  _cutoff: 5,

  getDay: function(dateObj) {
    var weekday = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat'
    };

    var hour = parseInt(dateObj.getHours(), 10);
    var day = weekday[dateObj.getDay()];

    if(hour < helpers._cutoff) {
      day = (day === 'Sun') ? 'Sat' : weekday[dateObj.getDay()-1];
    }

    return day;
  },

  getTime: function(dateObj) {
    var time = parseInt(dateObj.getHours(), 10);
    time += parseFloat(dateObj.getMinutes()/60);
    return time;
  }
};

// formerly restaurant.js

  // wrote in pseudo-classical style since I didn't want all instances
  // of Restaurant to have their own instance of isOpen
var Restaurant = function(name, rawHours) {
  this.name = JSON.parse(name);
  this.schedule = helpers.parseRawHours(rawHours);
};

  // returns true if it's open for the time, false if not
Restaurant.prototype.isOpen = function(dateObj) {
  var time = helpers.getTime(dateObj);
  var day = helpers.getDay(dateObj);

  if(typeof this.schedule[day] === 'undefined') { return false; }
  var open = this.schedule[day].open;
  var close = this.schedule[day].close;

  if(open < close && open <= time && time < close) {
    return true;
  } else if(open > close) {     // if it rolls over to the next day (e.g. 1800 - 0200)
    if( (open <= time && time <= 24) || (0 <= time && time < close) ) {
      return true;
    }
  }
  return false;
};

// formerly commaseparated.js

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
        d3.csv(csv_filepath, function (err, data) {
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

var parseCSV = commaseparated.cacher();

var find_open_restaurants = function(csv_filepath, dateObj, callback) {
  parseCSV(csv_filepath, function(restaurants) {
    var openSpots = [];
    var day = helpers.getDay(dateObj);

    _.each(restaurants, function(rest) {
      if(rest.isOpen(dateObj)) {
        var spot = {
          name: rest.name,
          open: rest.schedule[day].open,
          close: rest.schedule[day].close
        };

        openSpots.push(spot);
      }
    });

    return (callback) ? callback(openSpots) : openSpots;
  });
};

find_open_restaurants('./rest_hours.csv', new Date());

//   // this is to demonstrate the caching.. need a setTimeout to give the server
//   //  some time to read and parse the CSV
// setTimeout(function(){
//   find_open_restaurants('./rest_hours.csv', new Date());
// }, 1000);