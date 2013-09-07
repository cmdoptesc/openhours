Open Hours
==========

### To run ###
1) Make sure you have Node installed, and just type `npm install`!

2) After that, run it with `node index.js`

### Notes ###
* `openhours.js` and `index.js` are basically just front-ends, most of the data munging happens in the first three functions of `helpers.js` and time checking happens in `restaurant.js`.
* `cacher` (in commaseparated.js) caches all the parsed restaurants from a CSV file, so subsequent calls using the same CSV file should read from memory instead of the hard drive
* it's definitely not optimised, but once everything is parsed and cached, the lookup time will be linear
*  chose to store restaurants in an array since it's quicker to iterate over an array; however, if we wanted to look up specific restaurants, an object with restaurant names as keys would be a better suited for that task

### Dependencies ###
Underscore.js
(and a nicely formatted csv file)

[al lin](http://cmdoptesc.com)