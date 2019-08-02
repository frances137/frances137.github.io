/* global d3 */
var margin = {top: 25, right: 60, bottom: 60, left: 60},
    width = (window.innerWidth * (2/3)), // Use the window's width 
    height = window.innerHeight - margin.top - margin.bottom - 100, // Use the window's height (-100 to remove buttons height and margins)
    duration = 1500,
    data,
    svg,
    canvas,
    xScale,
    yScale,
    yAxis,
    lastScene = 1;


async function init() {
    data = await d3.csv("data/population-pr.csv");
    removeCommas(data, "Population");

    buildCanvas();
}

function buildCanvas() {
    xScale = d3.scaleLinear()
            .domain([parseInt(getMin(data, "Year")) - 1, parseInt(getMax(data, "Year")) + 1]) // input
            .range([0, width - margin.right]); // output

    yScale = d3.scaleLinear()
            .domain([parseInt(getMin(data, "Population")) - 100000, parseInt(getMax(data, "Population")) + 100000])
            .range([height, 0]);

    svg = d3.select("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            
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
    
    svg.append("g").attr("transform","translate(" + margin.left + "," + (height + margin.top) + ")").call(d3.axisBottom(xScale));
    yAxis = svg.append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
    goToScene(1);
}

function goToScene(scene) {
    console.log("Scene: " + scene);
    console.log("Last Scene: " + lastScene);
    switch (scene) {
        case 1:
            if (lastScene === 1) {
                playScene1();
            } else if(lastScene === 2) {
                rewindScene2();
            } else {
                rewindScene3();
                rewindScene2();
            }
            
            lastScene = 1;
            break;
        case 2:
            if (lastScene === 1) {
                playScene2();
            } else if(lastScene === 3) {
                rewindScene3();
            }
            
            lastScene = 2;
            break;
        case 3:
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
                console.log("playing Scene 1!");
    
    yScale = d3.scaleLinear()
            .domain([parseInt(getMin(data, "Population")) - 100000, parseInt(getMax(data, "Population")) + 100000])
            .range([height, 0]);
    
    var dots = canvas.filter(function (d) {
        return d.Year <= 2004;
    })
            .attr("cy", height)
            .attr("r", 0);

    dots.transition("playScene1")
            .duration(duration)
            .attr("r", 5)
            .attr("cy", function (d) {
        console.log("Population: " + d.Population);
                return yScale(d.Population);
            });

    yAxis.call(d3.axisLeft(yScale));
    
    addTooltip(dots, "Population", "Population");
    
}

function playScene2() {
    var dots = canvas
            .filter(function (d) {
                return d.Year > 2004;
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
            .filter(function (d) {
                return d.Year > 2004;
            })
            .attr("cy", 0)
            .attr("r", 0);
}

function playScene3() {
    yScale = d3.scaleLinear()
            .domain([0, parseInt(getMax(data, "colName")) + 1000])
            .range([height, 0]);
    
    canvas.transition("playScene3")
            .attr("cy", function (d) {
                return yScale(d.colName);
            })
            .duration(duration);
    
    
    yAxis.call(d3.axisLeft(yScale));
    
    addTooltip(canvas, "yLabel", "colName");
}

function rewindScene3() {
    yScale = d3.scaleLinear()
            .domain([parseInt(getMin(data, "Population")) - 100000, parseInt(getMax(data, "Population")) + 100000])
            .range([height, 0]);
    
    canvas.transition("rewindScene3")
            .attr("cy", function (d) {
                return yScale(d.Population);
            })
            .duration(duration);
    
    yAxis.call(d3.axisLeft(yScale));
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