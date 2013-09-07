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
  }
};

module.exports = helpers;