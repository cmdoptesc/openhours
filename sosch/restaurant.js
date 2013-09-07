var helpers = require('./helpers.js');

var Restaurant = function(name, rawHours) {
  this.name = JSON.parse(name);
  this.schedule = helpers.parseRawHours(rawHours);
};

  // returns true if it's open for the time, false if not
Restaurant.prototype.isOpen = function(dateObj) {
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

  if(typeof this.schedule[day] === 'undefined') { return false; }
  var open = this.schedule[day].open;
  var close = this.schedule[day].close;

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

module.exports = Restaurant;