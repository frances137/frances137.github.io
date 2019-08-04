/* global d3 */
var margin = {top: 25, right: 60, bottom: 60, left: 80},
    width = (window.innerWidth * (2/3)), // Use the window's width 
    height = window.innerHeight - margin.top - margin.bottom - 100, // Use the window's height (-100 to remove buttons height and margins)
    duration = 1500,
    data,
    svg,
    canvas,
    xScale,
    xAxis,
    yScale,
    yAxis,
    yLabel,
    lastScene = 1,
    maxPopulationIndex;
    
async function init() {
    data = await d3.csv("data/population-pr.csv");
    removeCommas(data, "Population");

    buildCanvas();
}

function buildCanvas() {
    xScale = d3.scaleBand()
            .domain(getArray(data, "Year")) // input
            .range([0, width - margin.right]); // output

    yScale = d3.scaleLinear()
            .domain([parseInt(getMin(data, "Population")) - 100000, parseInt(getMax(data, "Population")) + 100000])
            .range([height, 0]);

    svg = d3.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
            
    canvas = svg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .selectAll("circle")
            .data(data).enter().append("circle")
            .attr("cx", function (d, i) {
                return xScale(d.Year);
            })
            .attr("class", "dot");

    tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    
    // X axis
    xAxis = d3.axisBottom(xScale)
            .tickValues(xScale.domain().filter(function (d, i) {
                return !(i % 5);
            }));
            
    // Add the x Axis
    svg.append("g").attr("transform","translate(" + margin.left + "," + (height + margin.top) + ")").call(xAxis);

    // text label for the x axis
    svg.append("text")
            .attr("transform",
                    "translate(" + (width / 2) + " ," +
                    (height + margin.top + 35) + ")")
            .text("Year");
    
    // Y label
    yAxis = svg.append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
    yLabel = svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle");
    
    maxPopulationIndex = getIndex("Population")
    
    goToScene(1);
}

function goToScene(scene) {
    switch (scene) {
        case 1:
            if (lastScene === 1) {
                updateAxisY("Population", "Population", "Population - Puerto Rico", 100000);
                addAnnotation(xScale(data[maxPopulationIndex].Year),
                        yScale(data[maxPopulationIndex].Population),
                        "Population reached its peak",
                        "annotation1");
                playScene1();
            } else if (lastScene === 2) {
                removeAnnotation("annotation2");
                rewindScene2();
            } else {
                updateAxisY("Population", "Population", "Population - Puerto Rico", 100000);
                rewindScene3();
                rewindScene2();
                addAnnotation(xScale(data[maxPopulationIndex].Year),
                        yScale(data[maxPopulationIndex].Population),
                        "Population reached its peak",
                        "annotation1");
            }
            
            lastScene = 1;
            break;
        case 2:
            if (lastScene === 1) {
                playScene2();
                addAnnotation(xScale(data[data.length - 1].Year),
                        yScale(data[data.length - 1].Population),
                        "Population dropped around 9%",
                        "annotation2");
            } else if (lastScene === 3) {
                updateAxisY("Population", "Population", "Population - Puerto Rico", 100000);
                rewindScene3();
                addAnnotation(xScale(data[maxPopulationIndex].Year),
                        yScale(data[maxPopulationIndex].Population),
                        "Population reached its peak",
                        "annotation1");
                addAnnotation(xScale(data[data.length - 1].Year),
                        yScale(data[data.length - 1].Population),
                        "Population dropped around 9%",
                        "annotation2");
            }
            
            lastScene = 2;
            break;
        case 3:
            updateAxisY("rateGrowth", "Growth Rate", "Annual Population Growth Rates - Puerto Rico", 1000);
            removeAnnotation("annotation1");
            removeAnnotation("annotation2");
            if (lastScene === 1) {
                playScene2();
            }
            playScene3();
            lastScene = 3;
            break;
        default:
        // code block
    }
    updateSceneMessage();
}

function playScene1() {
    var dots = canvas.filter(function (d,i) {
        return i <= maxPopulationIndex;
    })
            .attr("cy", height)
            .attr("r", 0);

    dots.transition("playScene1")
            .duration(duration)
            .attr("r", 5)
            .attr("cy", function (d) {
                return yScale(d.Population);
            });
    
    addTooltip(dots, "Population", "Population");
    
}

function playScene2() {
    var dots = canvas
            .filter(function (d,i) {
                return i > maxPopulationIndex;
            })
            .attr("cy", 0)
            .attr("r", 0)
            .attr("class", "dot");
    
    dots.transition("playScene2")
            .attr("r", 5)
            .attr("cy", function (d) {
                return yScale(d.Population);
            })
            .duration(duration);
    
    addTooltip(dots, "Population", "Population");
    
}

function rewindScene2() {
    canvas.transition("rewindScene2").duration(duration)
            .filter(function (d,i) {
                return i > maxPopulationIndex;
            })
            .attr("cy", 0)
            .attr("r", 0);
}

function playScene3() {
    canvas.transition("playScene3")
            .attr("cy", function (d) {
                console.log("Year: " + d.Year + " Rate: " + d.rateGrowth);
                return yScale(d.rateGrowth);
            })
            .duration(duration);
    
    addTooltip(canvas, "Growth Rate", "rateGrowth");
    addAxisZero();
}

function rewindScene3() {
    canvas.transition("rewindScene3")
            .attr("cy", function (d) {
                return yScale(d.Population);
            })
            .duration(duration);
    
    addTooltip(canvas, "Population", "Population");
    removeAxisZero();
}

function addTooltip(points, yLabel, param) {
    points
        .on("mouseover", function (d) {
        tooltip.transition()
                .duration(200)
                .style("opacity", .9);
        tooltip.html("Year: " + d.Year + "<br/>" + yLabel + ": " + numberWithCommas(d[param]))
                .style("left", (d3.event.pageX - 62) + "px")
                .style("top", (d3.event.pageY - 40) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
        });
}

function getMin(arr, prop) {
    var min;
    for (var i = 0; i < arr.length; i++) {
        if (!min || parseInt(arr[i][prop]) < parseInt(min[prop]))
            min = arr[i];
    }
    return min[prop];
}

function getMax(arr, field) {
    var max;
    for (var i = 0; i < arr.length; i++) {
        if (!max || parseInt(arr[i][field]) > parseInt(max[field]))
            max = arr[i];
    }
    return max[field];
}

function removeCommas(arr, field) {
    arr.forEach(function (d) {
        d[field] = d[field].replace(/,/g, "");
    });
}

function numberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getArray(arr, field) {
    var newArray = [];
    
    arr.forEach(function (d,i) {
        newArray[i] = d[field];
    });
   
   return newArray;
}

function updateAxisY(field, label, title, padding) {
    yScale = d3.scaleLinear()
            .domain([parseInt(getMin(data, field)) - padding, parseInt(getMax(data, field)) + padding])
            .range([height, 0]);

    // Update axis
    yAxis.call(d3.axisLeft(yScale));
    
    // Update label  
    yLabel.text(label);
    
    d3.selectAll("#title").text(title);
    
}

function getIndex(field) {
    var max = getMax(data,field);
    var index = data.findIndex(function (item, i) {
        return item[field] === max;
    });
    
    return index;
}

function addAnnotation (x, y, text, annotation){
    //Draw one scheduled transition per circle
  //Each transitiopn as a head, a body, a tail, a start time, and an end time
  var drawnTransitions = svg
    .append("g")
      .classed(annotation, true)
      .attr("transform", "translate(" + (x + margin.left) + "," + (y + margin.top) + ")")
  var tails = drawnTransitions.append("path")
    .classed("tail", true)
    .attr("d", d3.symbol().size(150).type(d3.symbolCircle))
    .style("fill", 'none')
    .attr("opacity",0)
    .transition().delay(duration).duration(duration/2)
    .attr("opacity",1)
    .style("stroke", 'grey');
  var bodies = drawnTransitions.append("line")
    .classed("body", true)
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0)
    .attr("stroke-dasharray", "5")
    .style("stroke", 'grey');
  var starts = drawnTransitions.append("text")
    .classed("start-time", true)
    .classed("wrap", true)
    .attr("transform", "translate(0, " + (height - y) / 2 + ")")
    .text(text)
    .attr("text-anchor", "end")
    .attr("font-size", "13px")
    .style("fill", 'grey')
    .attr("fill-opacity", 0)
    .style("stroke", 'green')
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0);

  //Animate each transition (longer bodies, adequate position of heads, show start-times and end-times)
  bodies.transition().delay(duration)
    .attr("y2", ((height - y) / 2) - (starts.node().getBoundingClientRect().height ))
    .duration(duration/2);
    
  starts.transition().delay(duration * 3/2)
    .attr("fill-opacity", 1)
    .duration(duration/2);
}

function removeAnnotation(annotation) {
    var annotations = d3.selectAll("." + annotation)
            .attr("opacity", 1)
            .transition()
            .attr("opacity", 0)
    .duration(duration/2);
      
    annotations.remove();
}

function addAxisZero() {
  var axis = svg
    .append("g")
      .classed("axis0", true)
      .attr("transform", "translate(" + margin.left + "," + (yScale(0) + margin.top) + ")")
  
  axis.append("line")
    .classed("body", true)
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", width - margin.right)
    .attr("y2", 0)
    .attr("stroke-dasharray", "5")
    .style("stroke", 'grey');

}

function removeAxisZero(){
    var axis = d3.selectAll(".axis0")
            .attr("opacity", 1)
            .transition()
            .attr("opacity", 0)
    .duration(duration/2);
      
    axis.remove();
}

function updateSceneMessage() {
    switch(lastScene){
        case 1:
            d3.selectAll("#boxTitle").text("A growing population");
            d3.selectAll("#boxDetail")
                    .text("The Puerto Rican population grew at a steady pace, increasing from 2.4 million in the early 1960s to a peak of around 3.8 million in 2004");
            break;
        case 2:
            d3.selectAll("#boxTitle").text("Population reduction");
            d3.selectAll("#boxDetail")
                    .text("The population growth rate became negative in 2005. In a span of 14 years the population dropped to 3.2 million, a loss of about 630,000 residents. This reduction can be attributed to the fact that residents have greater access to contraceptive methods, an increase in the participation of women in the workforce, and people are better educated. In addition, the economy of Puerto Rico has made it more difficult for some to raise children.");
            break;
        case 3:
            d3.selectAll("#boxTitle").text("Growth rate descending");
            d3.selectAll("#boxDetail")
                    .text("Some relate the loss of population to the derogation of Section 936 of the Revenue Code (signed on 1996 but effective in 2005) which exempted multinational corporations from paying U.S. contributions on the profits from their operations on the island. The largest of the exoduses was in 2018 due to the destruction that Hurricane Maria left after passing through the island the previous year.");
            break;
    }
}