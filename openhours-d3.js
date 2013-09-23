
$(function() {
  d3.select("#ChartArea").append('svg:svg').attr("id",'ChartSVG');

  find_open_restaurants('rest_hours.csv', new Date(), function(openSpots) {
    render(openSpots);
  });
});


var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var d3methods = {
  hr_offset: 4,
  red_x: undefined
};

d3methods.key = function(d) {
    return d.name;
};

d3methods.setY = function(d, i) {
  return 'translate(0,'+ (((i+1)*12)+margin.top) +')';
};

d3methods.reverseScale = d3.scale.linear().domain([0, width]).range([d3methods.hr_offset, 29]);
d3methods.xScale = d3.scale.linear().domain([d3methods.hr_offset, 29]).range([0, width]),
d3methods.xValue = function(d) { return d3methods.xScale(d.close - (d.open-d3methods.hr_offset)); };

d3methods.dragmove = function(d) {
  d3methods.red_x += d3.event.dx;
  d3.select(this).attr("transform", "translate(" + d3methods.red_x + "," + (margin.top+1) + ")");

  var hrs = d3methods.reverseScale(d3methods.red_x);

  var tmp = new Date();
  if(hrs >= 24) {
    hrs -= 24;
    tmp.setDate(tmp.getDate()-1);
  }
  var today = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate(), Math.floor(hrs), Math.floor((hrs%1)*60), 0, 0);

  find_open_restaurants('rest_hours.csv', today, function(openSpots) {
    redraw(openSpots);
  });
};


var redraw = function(dataset) {
  var vis = d3.select("#ChartSVG");
  var gBar = vis.selectAll("g.bar-group");
  gBar = gBar.data(dataset, d3methods.key);

  gBar.exit().attr("opacity", 0.25)
      .transition()
        .duration(300)
        .attr("transform", function(d, i) {
          var x1 = d3methods.xScale(d.open);
          var x2 = x1 + d3methods.xValue(d);

          var translateX;
            // to move left/right depending where the red line is
          if(d3methods.red_x >= x2) {
            translateX = -700;
          } else if(d3methods.red_x <= x1) {
            translateX = width + 700;
          }
          return 'translate('+ translateX +','+ this._y +')';
        })
        .remove();

  gBar.attr("opacity", 0.75)
      .transition()
      .duration(250)
      .attr("transform", d3methods.setY)
      .each('end', function() {
        d3.select(this).attr("opacity", 1);

        var coordsRaw = d3.select(this).attr("transform");
        var coordsRegex = /(\d+)/g;
        if(coordsRaw) {
          var coords = coordsRaw.match(coordsRegex);
          this._y = coords[1];
        }
      });

  var group = gBar.enter()
      .append("svg:g")
      .attr("class", 'bar-group')
      .attr("transform", d3methods.setY);

  group.append('text')
      .attr("class", 'restaurant-names')
      .attr("x", function(d){
        return d3methods.xScale(d.open)-10;
      })
      .attr("y", 4)
      .attr("text-anchor", "end")
      .text(function(d){
        return d.name;
      });

  group.append('rect')
      .attr("class", 'rect-rest')
      .attr("x", function(d){
        return d3methods.xScale(d.open);
      })
      .attr("width", d3methods.xValue)
      .attr("height", 4)
      .on("mouseover", function() {
        d3.select(this).transition()
            .duration(100)
            .attr("height", 6)
            .attr("transform", "translate(0,-1)");
      })
      .on("mouseout", function() {
        d3.select(this).transition()
            .duration(100).attr('height', 4)
            .attr("transform", "translate(0,0)");
      });

        // bring the current time group to the front again
      var current = d3.select("g.current-time-group").node();
      current.parentNode.appendChild(current);
}

var render = function(dataset) {
  var vis = d3.select("#ChartSVG");

    // x-axis
  var xAxis = d3.svg.axis().scale(d3methods.xScale).orient("top").tickSize(0).tickFormat(function(d){
        return helpers.to12Hr(d%24);
      });

  vis.append("g")
      .attr("class", 'x-axis')
      .attr("transform", "translate(0,20)")
      .call(xAxis);

    // rules
  var x_rules = vis.append("g").attr("class", 'x-rules');
  x_rules.selectAll("line.rule")
      .data(d3methods.xScale.ticks(29))
      .enter().append("line")
      .attr("class", 'rule')
      .attr("x1", d3methods.xScale)
      .attr("x2", d3methods.xScale)
      .attr("y1", margin.top)
      .attr("y2", height);

    // all the open restaurants
  var gBar = vis.selectAll("g.bar-group");
  gBar = gBar.data(dataset, d3methods.key);

  var group = gBar.enter().append("svg:g")
      .attr("class", 'bar-group')
      .attr("transform", d3methods.setY);

  group.append('text')
      .attr("class", 'restaurant-names')
      .attr("x", function(d){
        return d3methods.xScale(d.open)-10;
      })
      .attr("y", 4)
      .attr("text-anchor", "end")
      .text(function(d){
        return d.name;
      });

  group.append('rect')
      .attr("class", 'rect-rest')
      .attr("x", function(d){
        return d3methods.xScale(d.open);
      })
      .attr("width", d3methods.xValue)
      .attr("height", 4)
      .on("mouseover", function() {
        d3.select(this).transition()
            .duration(100)
            .attr("height", 6)
            .attr("transform", "translate(0,-1)");
      })
      .on("mouseout", function() {
        d3.select(this).transition()
            .duration(100).attr('height', 4)
            .attr("transform", "translate(0,0)");
      });

  var currentTime = new Date();
  var rightNow = (currentTime.getHours() < helpers._cutoff) ? currentTime.getHours()+24 : currentTime.getHours();
  rightNow += Math.round((currentTime.getMinutes()/60)*10000)/10000;
  d3methods.red_x = d3methods.xScale(rightNow);

    // group representing current time
  var gCurrent = vis.append("svg:g")
                  .attr("class", 'current-time-group')
                  .attr("transform", 'translate('+ d3methods.red_x +','+ (margin.top+1) +')')
                  .call(d3.behavior.drag().on("drag", d3methods.dragmove));

    // the red line
  gCurrent.append("line")
      .attr("class", 'current-time')
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", height-margin.top-1);

    // to make the click area bigger
  gCurrent.append('rect')
      .attr("class", 'current-clickoverlay')
      .attr("x", -8)
      .attr("y", 0)
      .attr("width", 16)
      .attr("height", height-margin.top-1)
      .attr("opacity", 0);
};
