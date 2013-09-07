Open Hours
==========

### To run ###
1) Make sure you have Node installed, and just type `npm install`!

2) After that, run it with `node index.js`

### Notes ###
* `openhours.js` and `index.js` are basically just front-ends, most of the data munging happens in the first three functions of `helpers.js` and time checking happens `restaurant.js`.
* `cacher` (in commaseparated.js) caches all the parsed restaurants from a CSV file, so subsequent calls using the same CSV file should read from memory instead of the hard drive
* it's definitely not optimised, but once everything is parsed and cached, the lookup time will be linear

### Dependencies ###
Underscore.js
(and a nicely formatted csv file)

[al lin](http://cmdoptesc.com)