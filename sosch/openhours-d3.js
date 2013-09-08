
$(function() {
  d3.select("#ChartArea").append('svg:svg').attr("id",'ChartSVG');

  find_open_restaurants('rest_hours.csv', new Date(), function(openSpots) {
    render(openSpots);
  });
});


var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var render = function(dataset) {
  console.log('called');
  var vis = d3.select("#ChartSVG");

    // where the bar chart starts
  var hr_offset = 6;

  var max = d3.max(dataset, function(d) {
    return d.close;
  });

  var xScale = d3.scale.linear().domain([hr_offset, max+1]).range([0, width]),
      xValue = function(d) { return xScale(d.close - (d.open-hr_offset)); },
      xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(function(d){
        return helpers.to12Hr(d%24);
      });

  // var yValue = function(d) { return d.name; },
  //     yScale = d3.scale.ordinal().rangeRoundBands([0, width], .1), // value -> display
  //     yMap = function(d) { return yScale(yValue(d)); }, // data -> display
  //     yAxis = d3.svg.axis().scale(yScale).orient("left");

  var currentTime = new Date();
  var hours = (currentTime.getHours() < helpers.cutoff) ? currentTime.getHours()+24 : currentTime.getHours();
  hours += Math.round((currentTime.getMinutes()/60)*10000)/10000;

  vis.append("line")
      .attr("class", 'current-time')
      .attr("x1", xScale(hours))
      .attr("x2", xScale(hours))
      .attr("y1", 0)
      .attr("y2", height);

  vis.append("g")
      .attr("class", 'x-axis')
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  var x_rules = vis.append("g").attr("class", 'x-rules');

  x_rules.selectAll("line.rule")
      .data(xScale.ticks(max))
      .enter().append("line")
      .attr("class", 'rule')
      .attr("x1", xScale)
      .attr("x2", xScale)
      .attr("y1", 0)
      .attr("y2", height);

  var gBar = vis.selectAll("g.bar-group");
  gBar = gBar.data(dataset);

  var group = gBar.enter().append("svg:g").attr("class", 'bar-group');

  group.append('text')
    .attr("class", 'restaurant-names')
    .attr("x", function(d){
      return xScale(d.open)-10;
    })
    .attr("y", function(d, i){
      return i*10;
    })
    .attr("text-anchor", "end")
    .text(function(d){
      return d.name;
    });

  group.append('rect')
    .attr("class", 'rect-rest')
    .attr("x", function(d){
      return xScale(d.open);
    })
    .attr("y", function(d, i){
      return i*10;
    })
    .attr("width", xValue)
    .attr("height", 4)
    .on("mouseover", function() {
      d3.select(this).transition()
          .duration(100)
          .attr("height", 10)
          .attr("transform", "translate(0,-3)");
    })
    .on("mouseout", function() {
      d3.select(this).transition()
          .duration(100).attr('height', 4)
          .attr("transform", "translate(0,0)");
    });



};