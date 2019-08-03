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
    lastScene = 1;


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
//            .style("text-anchor", "middle")
            .text("Year");
    
    
//  
    
    // Y label
    yAxis = svg.append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
    yLabel = svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle");
    
    goToScene(1);
}

function goToScene(scene) {
    switch (scene) {
        case 1:
            if (lastScene === 1) {
                updateAxisY("Population", "Population", "Puerto Rico's Population Growth");
                playScene1();
            } else if(lastScene === 2) {
                rewindScene2();
            } else {
                updateAxisY("Population", "Population", "Puerto Rico's Population Growth");
                rewindScene3();
                rewindScene2();
            }
            
            lastScene = 1;
            break;
        case 2:
            if (lastScene === 1) {
                playScene2();
            } else if(lastScene === 3) {
                updateAxisY("Population", "Population", "Puerto Rico's Population Growth");
                rewindScene3();
            }
            
            lastScene = 2;
            break;
        case 3:
            updateAxisY("colName", "Rate of Change", "Puerto Rico's Population Rate of Change");
            if (lastScene === 1) {
                playScene2();
                playScene3();
            } else if(lastScene === 2) {
                playScene3();
            } 
            
            lastScene = 3;
            break;
        default:
        // code block
    }
}

function playScene1() {
    var index = getIndex();
    
    var dots = canvas.filter(function (d,i) {
        return i <= index;
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
    var index = getIndex();
    
    var dots = canvas
            .filter(function (d,i) {
                return i > index;
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
    var index = getIndex();
    
    canvas.transition("rewindScene2").duration(duration)
            .filter(function (d,i) {
                return i > index;
            })
            .attr("cy", 0)
            .attr("r", 0);
}

function playScene3() {
//    yScale = d3.scaleLinear()
//            .domain([0, parseInt(getMax(data, "colName")) + 1000])
//            .range([height, 0]);
    
    canvas.transition("playScene3")
            .attr("cy", function (d) {
                return yScale(d.colName);
            })
            .duration(duration);
    
    addTooltip(canvas, "yLabel", "colName");
}

function rewindScene3() {
    canvas.transition("rewindScene3")
            .attr("cy", function (d) {
                return yScale(d.Population);
            })
            .duration(duration);
    
    addTooltip(canvas, "Population", "Population");
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

function updateAxisY(field, label, title) {
    yScale = d3.scaleLinear()
            .domain([parseInt(getMin(data, field)) - 100000, parseInt(getMax(data, field)) + 100000])
            .range([height, 0]);

    // Update axis
    yAxis.call(d3.axisLeft(yScale));
    
    // Update label  
    yLabel.text(label);
    
    d3.selectAll("#title").text(title);
    
}

function getIndex() {
    var max = getMax(data,"Population");
    var year = data.findIndex(function (item, i) {
        return item.Population === max;
    });
    
    return year;
}