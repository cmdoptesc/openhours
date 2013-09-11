
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
  hr_offset: 6
};

d3methods.key = function(d) {
    return d.name;
};

d3methods.setY = function(d, i) {
  return 'translate(0,'+ (i+1)*12 +')';
};

var redraw = function(dataset) {

  var max = d3.max(dataset, function(d) {
    return d.close;
  });

  var xScale = d3.scale.linear().domain([d3methods.hr_offset, max+1]).range([0, width]),
      xValue = function(d) { return xScale(d.close - (d.open-d3methods.hr_offset)); };

  var vis = d3.select("#ChartSVG");
  var gBar = vis.selectAll("g.bar-group");
  gBar = gBar.data(dataset, d3methods.key);

  gBar.exit().transition()
      .duration(500)
      .attr("transform", 'scale(1,0.5)')
      .remove();

  gBar.transition()
      .duration(200)
      .attr("transform", d3methods.setY);

  var group = gBar.enter().append("svg:g")
      .attr("class", 'bar-group')
      .attr("transform", d3methods.setY);

  group.append('text')
    .attr("class", 'restaurant-names')
    .attr("x", function(d){
      return xScale(d.open)-10;
    })
    .attr("y", 4)
    .attr("text-anchor", "end")
    .text(function(d){
      return d.name;
    });

  group.append('rect')
    .attr("class", 'rect-rest')
    .attr("x", function(d){
      return xScale(d.open);
    })
    .attr("width", xValue)
    .attr("height", 4)
    .on("mouseover", function() {
      d3.select(this).transition()
          .duration(100)
          .attr("height", 8)
          .attr("transform", "translate(0,-2)");
    })
    .on("mouseout", function() {
      d3.select(this).transition()
          .duration(100).attr('height', 4)
          .attr("transform", "translate(0,0)");
    });

    var current = d3.select("line.current-time").node();
    current.parentNode.appendChild(current);
}

var render = function(dataset) {
  var vis = d3.select("#ChartSVG");

  var max = d3.max(dataset, function(d) {
    return d.close;
  });

  var xScale = d3.scale.linear().domain([d3methods.hr_offset, max+1]).range([0, width]),
      xValue = function(d) { return xScale(d.close - (d.open-d3methods.hr_offset)); },
      xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(function(d){
        return helpers.to12Hr(d%24);
      });

  var reverseScale = d3.scale.linear().domain([0, width]).range([d3methods.hr_offset, max+1]);

  // var yValue = function(d) { return d.name; },
  //     yScale = d3.scale.ordinal().rangeRoundBands([0, width], .1), // value -> display
  //     yMap = function(d) { return yScale(yValue(d)); }, // data -> display
  //     yAxis = d3.svg.axis().scale(yScale).orient("left");

  var currentTime = new Date();
  var hours = (currentTime.getHours() < helpers._cutoff) ? currentTime.getHours()+24 : currentTime.getHours();
  hours += Math.round((currentTime.getMinutes()/60)*10000)/10000;

  function move(){
      var dragTarget = d3.select(this);
      dragTarget
          .attr("x1", function(){return d3.event.dx + parseInt(dragTarget.attr("x1"))})
          .attr("x2", function(){return d3.event.dx + parseInt(dragTarget.attr("x2"))})
  };


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
  gBar = gBar.data(dataset, d3methods.key);

  var group = gBar.enter().append("svg:g")
      .attr("class", 'bar-group')
      .attr("transform", d3methods.setY);

  group.append('text')
    .attr("class", 'restaurant-names')
    .attr("x", function(d){
      return xScale(d.open)-10;
    })
    .attr("y", 4)
    .attr("text-anchor", "end")
    .text(function(d){
      return d.name;
    });

  group.append('rect')
    .attr("class", 'rect-rest')
    .attr("x", function(d){
      return xScale(d.open);
    })
    .attr("width", xValue)
    .attr("height", 4)
    .on("mouseover", function() {
      d3.select(this).transition()
          .duration(100)
          .attr("height", 8)
          .attr("transform", "translate(0,-2)");
    })
    .on("mouseout", function() {
      d3.select(this).transition()
          .duration(100).attr('height', 4)
          .attr("transform", "translate(0,0)");
    });

  vis.append("line")
      .attr("class", 'current-time')
      .attr("x1", xScale(hours))
      .attr("x2", xScale(hours))
      .attr("y1", 0)
      .attr("y2", height)
      .call(d3.behavior.drag().on("drag", move))
      .on("mouseup", function(){
        var hrs = reverseScale(d3.select(this).attr("x1"));

        var tmp = new Date();
        if(hrs >= 24) {
          hrs -= 24;
          tmp.setDate(tmp.getDate()-1);
        }
        var today = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate(), Math.floor(hrs), Math.floor((hrs%1)*60), 0, 0);

        find_open_restaurants('rest_hours.csv', today, function(openSpots) {
          redraw(openSpots);
        });

      });


};