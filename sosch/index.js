openhours = require('./openhours.js');

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdout.write('Please enter the name of your CSV file: ');
process.stdin.on('data', function(chunk) {
  process.stdout.write('processing.. ' + chunk);
  openhours('./' + chunk.trim(), new Date(), function() {
    process.exit();
  });
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});