
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
  hr_offset: 4
};

d3methods.key = function(d) {
    return d.name;
};

d3methods.setY = function(d, i) {
  return 'translate(0,'+ (i+1)*12 +')';
};

d3methods.reverseScale = d3.scale.linear().domain([0, width]).range([d3methods.hr_offset, 29]);
d3methods.xScale = d3.scale.linear().domain([d3methods.hr_offset, 29]).range([0, width]),
d3methods.xValue = function(d) { return d3methods.xScale(d.close - (d.open-d3methods.hr_offset)); };

d3methods.move = function(){
  var dragTarget = d3.select(this);
  dragTarget
    .attr("x1", function(){return d3.event.dx + parseInt(dragTarget.attr("x1"))})
    .attr("x2", function(){return d3.event.dx + parseInt(dragTarget.attr("x2"))})

  var hrs = d3methods.reverseScale(dragTarget.attr("x1"));

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

      var current = d3.select("line.current-time").node();
      current.parentNode.appendChild(current);
}

var render = function(dataset) {
  var vis = d3.select("#ChartSVG");


  // var yValue = function(d) { return d.name; },
  //     yScale = d3.scale.ordinal().rangeRoundBands([0, width], .1), // value -> display
  //     yMap = function(d) { return yScale(yValue(d)); }, // data -> display
  //     yAxis = d3.svg.axis().scale(yScale).orient("left");

    // x-axis
  var xAxis = d3.svg.axis().scale(d3methods.xScale).orient("bottom").tickFormat(function(d){
        return helpers.to12Hr(d%24);
      });
  
  vis.append("g")
      .attr("class", 'x-axis')
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // rules
  var x_rules = vis.append("g").attr("class", 'x-rules');
  x_rules.selectAll("line.rule")
      .data(d3methods.xScale.ticks(29))
      .enter().append("line")
      .attr("class", 'rule')
      .attr("x1", d3methods.xScale)
      .attr("x2", d3methods.xScale)
      .attr("y1", 0)
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

    // line representing current time
  vis.append("line")
      .attr("class", 'current-time')
      .attr("x1", d3methods.xScale(rightNow))
      .attr("x2", d3methods.xScale(rightNow))
      .attr("y1", 0)
      .attr("y2", height)
      .call(d3.behavior.drag().on("drag", d3methods.move));
};
