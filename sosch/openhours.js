var fs = require('fs');
var _ = require('underscore');

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

  parseRawHours: function(rawHours) {
    var days = {};

    var schedules = rawHours.split('/');
    _.each(schedules, function(schedule) {
      schedule = schedule.trim();

      var openDays = [];     // array of days sharing the same schedule

      var dayRangeRegex = /[a-z]{3}-[a-z]{3}/i;
      var dayRange;
      if(dayRangeRegex.test(schedule)) {
        dayRange = dayRangeRegex.exec(schedule)[0].split('-');
        openDays = helpers.rangeToDays(dayRange[0], dayRange[1]);
      }

      var singleDaysRegex = /[a-zA-Z]{3}/g;
      var res;
      while (res = singleDaysRegex.exec(schedule)) {
          openDays.push(res[0]);
      }

      var hoursRegex = /\d*:*\d+ [ap]m - \d*:*\d+ [ap]m/;
      var openclose = hoursRegex.exec(schedule)[0].split(' - ');

      _.each(openDays, function(day){
        days[day] = {};
        days[day].open = helpers.to24Hr(openclose[0]);
        days[day].close = helpers.to24Hr(openclose[1]);
      });
    });

    return days;
  }
};

var makeRestaurant = function(name, rawHours) {
  var rest = {};
  rest.name = JSON.parse(name);
  rest.schedule = helpers.parseRawHours(rawHours);

  return rest;
};

  // returns true if it's open for the time, false if not
var checkOpen = function(rest, dateObj) {
  var weekday = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat'
  };

  var day = weekday[dateObj.getDay()];
  var time = parseInt(dateObj.getHours(), 10);
  time += parseFloat(dateObj.getMinutes()/60);

  var cutoff = 5;

    // if it's after midnight, use the schedule from the previous day
  if(time < cutoff) {
    day = (day === 'Sun') ? 'Sat' : weekday[dateObj.getDay()-1];
  }

  if(typeof rest.schedule[day] === 'undefined') { return false; }
  var open = rest.schedule[day].open;
  var close = rest.schedule[day].close;

    // complicated checks for after midnight..
  if(time < cutoff) {
    if(close <= cutoff && time < close) {
      if(open < cutoff && open < time) {
        return true;
      } else if(open >= cutoff && open <= 24) {
        return true;
      }
    }
  } else if(open < time && time < close) {
    return true;
  }
  return false;
};

var parseCSV = function(csvData) {
  var restaurantsRaw = csvData.toString().split(/\r?\n/);
  var parsed = [];
  var restInfo, venue;

  _.each(restaurantsRaw, function(rest){
    if(rest.length > 0) {
      restInfo = rest.split(',"');
      venue = makeRestaurant(restInfo[0], restInfo[1]);
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
    if(checkOpen(rest, dateObj)) {
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
