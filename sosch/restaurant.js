var helpers = require('./helpers.js');

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

module.exports = Restaurant;