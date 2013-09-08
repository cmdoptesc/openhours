// formerly helpers.js

var helpers = {
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

  to12Hr: function(twentyfour) {
    twentyfour = parseFloat(twentyfour);

    var min = Math.floor((twentyfour % 1) * 60);
    if(min === 0) {
      min = '';
    } else {
      min = min + '';
      min = (min.length<2) ? ':0'+ min : ':'+ min;
    }

    var hr = Math.floor(twentyfour);
    if(hr === 0 || hr === 24) {
      hr = '12'+ min +' am';
    } else if(hr === 12) {
      hr = '12'+ min +' pm';
    } else if(hr > 12) {
        hr = hr%12 + min +' pm';
    } else {
      hr = hr + min +' am';
    }

    return hr;
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

var makeSchedule = function(rawSchedule) {
  var schedule = init(rawSchedule);

  function _parseHours(rawHours) {
    var hoursRegex = /\d*:*\d+ [ap]m - \d*:*\d+ [ap]m/;
    var openclose = rawHours.match(hoursRegex)[0].split(' - ');
    openclose[0] = helpers.to24Hr(openclose[0]);
    openclose[1] = helpers.to24Hr(openclose[1]);

    return openclose;
  }

  function _parseDays(rawDays) {
    var openDays = [];     // array of days sharing the same schedule

    var dayRangeRegex = /[a-z]{3}-[a-z]{3}/i;
    if(rawDays.match(dayRangeRegex) && rawDays.match(dayRangeRegex).length > 0) {
      var dayRange = rawDays.match(dayRangeRegex)[0].split('-');
      openDays = helpers.rangeToDays(dayRange[0], dayRange[1]);
    }

    var singleDaysRegex = /([a-zA-Z]{3})/g;
    var singleDays = rawDays.match(singleDaysRegex);

    _.each(singleDays, function(day) {
      openDays.push(day);
    });

    return openDays;
  }

  function init(rawSched) {
    var parsed = {};
    var scheds = rawSched.split('/');
    _.each(scheds, function(sched) {
      sched = sched.trim();

      var openclose = _parseHours(sched);
      var days = _parseDays(sched);

      _.each(days, function(day){
        parsed[day] = {};
        parsed[day].open = openclose[0];
        parsed[day].close = openclose[1];
      });
    });
    return parsed;
  }

  return schedule;
};

// formerly restaurant.js

  // wrote in pseudo-classical style since I didn't want all instances
  // of Restaurant to have their own instance of isOpen
var Restaurant = function(name, rawHours) {
  this.name = name;
  this.schedule = makeSchedule(rawHours);
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

var parseCSV = function(filename, callback) {
  d3.text(filename, function(err, csvData) {
    var data = d3.csv.parseRows(csvData);
    var restaurants = [];

    for(var i=0; i<data.length; i++) {
      var rest = new Restaurant(data[i][0], data[i][1]);
      restaurants.push(rest);
    }

    return (callback) ? callback(restaurants) : restaurants;
  });
};

var find_open_restaurants = function(csv_filepath, dateObj, callback) {
  parseCSV(csv_filepath, function(restaurants) {
    var openSpots = [];
    var day = helpers.getDay(dateObj);
    for(var i=0; i<restaurants.length; i++) {
      if(restaurants[i].isOpen(dateObj)) {
        var spot = {
          name: restaurants[i].name,
          open: restaurants[i].schedule[day].open,
          close: restaurants[i].schedule[day].close
        };
        if(spot.close < helpers._cutoff) {
          spot.close += 24;
        }
        openSpots.push(spot);
      }
    }
    openSpots = _.sortBy(openSpots, function(spot) {
      return spot.name;
    });
    return (callback) ? callback(openSpots) : openSpots;
  });
};
