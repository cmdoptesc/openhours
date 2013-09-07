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

  var cutoff = helpers.cutoff;

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