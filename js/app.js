import {csv} from "https://cdn.skypack.dev/d3-fetch@3";

// US map options
var options = {
  zoomSnap: .1,
  center: [39, -97],
  zoom: 4.3,
  minZoom: 2,
  zoomControl: false
  // attributionControl: false
}

// create map
var map = L.map('mapid', options);

// request tiles and add to map
var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// change zoom control position
L.control.zoom({
  position: 'bottomleft'
}).addTo(map);

// setup slider
var slider = document.getElementById('slider');

noUiSlider.create(slider, {
// Create two timestamps to define a range.
    range: {
        min: -10,
        max: 110
    },

// Steps of one week
    step: 1,

// Two more values indicate the handle starting positions.
    start: [40,70],

    tooltips: [true,true],

    connect: true,

// No decimals
    format: {
      to: function (value) {
        return Math.floor(Number(value));
      },
      from: function (value) {
        return Math.floor(Number(value));
      }
    }
});

var hexGridLayer = L.geoJSON();

// example breaks for legend
var breaksAnnual = [0, 20, 50, 75, 100, 150, 200, 366];
var breaksMonthly = [0, 2, 5, 10, 15, 20, 25, 31];
var breaks = breaksAnnual;
var colorize = chroma.scale('Spectral').domain([1,0]).classes(breaks).mode('lab');

// select time frame
var month = document.getElementById('month');
month.value = 'all';

month.addEventListener('change', function() {
  // console.log(this.value);
  // console.log(slider.noUiSlider.get());
  if (this.value == 'all') {
    breaks = breaksAnnual;
    colorize = chroma.scale('Spectral').domain([1,0]).classes(breaks).mode('lab');
  } else {
    breaks = breaksMonthly;
    colorize = chroma.scale('Spectral').domain([1,0]).classes(breaks).mode('lab');
  }
  updateMap(slider.noUiSlider.get());
  updateLegend(breaks,colorize);
});

console.log(document.querySelector('input[name="mode"]:checked').value);

slider.noUiSlider.on('update', function (values, handle) {
  // console.log(values);
  updateMap(values);
});

document.querySelectorAll('input[name="mode"]').forEach((item, i) => {
  item.addEventListener('change', () =>{
    // console.log(document.querySelector('input[name="mode"]:checked').value);
    // console.log(slider.noUiSlider.get());
    // console.log(month.value);
    updateMap(slider.noUiSlider.get());
  })
});
;

const tempData = await csv("data/minmaxtemps.csv");

// GET DATA
processData();

// PROCESS DATA FUNCTION
function processData() {

  console.log(hexgrid);
  console.log(tempData);

  drawMap();

  drawLegend(breaks, colorize);

}   //end processData()

// DRAW MAP FUNCTION
function drawMap() {

  hexGridLayer.addData(hexgrid).addTo(map);

  updateMap(slider.noUiSlider.get());

}   //end drawMap()

function drawLegend(breaks, colorize) {

  var legendControl = L.control({
    position: 'bottomright'
  });

  legendControl.onAdd = function(map) {

    var legend = L.DomUtil.create('div', 'legend');
    return legend;

  };

  legendControl.addTo(map);

  var legend = document.querySelector('.legend');
  var legendHTML = "<h3>Legend</h3> (days in temp. range)<ul>";

  for (var i = 0; i < breaks.length - 1; i++) {

    var color = colorize(breaks[i], breaks);

    var classRange = '<li><span style="background:' + color + '"></span> ' +
        breaks[i].toLocaleString() + ' &mdash; ' +
        breaks[i + 1].toLocaleString() + '</li>';
    legendHTML += classRange;

  }

  legendHTML += '</ul><p>Data from <a href="https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals" target="_blank">NOAA 30-Yr Normals (1991 – 2020)</a></p>';
  legend.innerHTML = legendHTML;

} // end drawLegend()

function updateMap(temps) {
  console.log(temps);
  console.log(month.value);
  console.log(document.querySelector('input[name="mode"]:checked').value);

  hexGridLayer.eachLayer(function (layer) {

    var searchStr = "bydate_"+month.value.toString()+"-";

    var dailyTemps = [];
    var hexId = layer.feature.properties['id'];

    const row = tempData.find(hex => hex.id == hexId);
    // console.log(row);

    if (document.querySelector('input[name="mode"]:checked').value == "minmax") {
      for (var prop in row) {
        // console.log(prop);
        if (prop.search(/tmax_bydate/) != -1) {
          if (prop.search(searchStr) != -1 || month.value == "all") {
            var date = prop.replace("dly_tmax_bydate_","").replace("_mean","");
            var maxTemp = row[prop];
            var minTemp = row[prop.replace("tmax","tmin")];
            if (minTemp >= temps[0] && maxTemp <= temps[1]) {
              dailyTemps.push({date:date,minTemp:minTemp,maxTemp:maxTemp});
            }
          }
        }
      }
    } else if (document.querySelector('input[name="mode"]:checked').value == "avg") {
      for (var prop in row) {
        // console.log(prop);
        if (prop.search(/tavg_bydate/) != -1) {
          if (prop.search(searchStr) != -1 || month.value == "all") {
            var date = prop.replace("dly_tavg_bydate_","").replace("_mean","");
            var avgTemp = row[prop];
            if (avgTemp >= temps[0] && avgTemp <= temps[1]) {
              dailyTemps.push({date:date,avgTemp:avgTemp});
            }
          }
        }
      }
    }


    // console.log(dailyTemps);

    layer.feature.properties["days"] = dailyTemps.length;
    // var popupText;
    //
    // if (month.value == "all") {
    //   if (dailyTemps.length == 0) {
    //     popupText = "No dates match the criteria."
    //   } else {
    //     popupText = layer.feature.properties["days"].toString()+" days";
    //   }
    // } else {
    //   if (dailyTemps.length == 0) {
    //     popupText = "No dates match the criteria."
    //   } else {
    //     popupText = JSON.stringify(dailyTemps);
    //   }
    // }
    // layer.bindPopup(popupText);


  });

  hexGridLayer.setStyle(style);


} // end updateMap()

function style (feature) {
  let color = 'lightgrey';
  if (feature.properties["days"] != undefined) {
    color = colorize(feature.properties["days"]);
  } else {
    console.log(feature);
  }
  return {
    fillColor: color,
    weight: 1.5,
    opacity: 1,
    color: 'grey',
    fillOpacity: 0.7
  };
}  // end style()

function updateLegend(breaks, colorize) {
  var legendul = document.querySelector(".legend ul");
  // console.log(legendUl);
  let legendList = "";

  for (var i = 0; i < breaks.length - 1; i++) {

    var color = colorize(breaks[i], breaks);

    var classRange = '<li><span style="background:' + color + '"></span> ' +
        breaks[i].toLocaleString() + ' &mdash; ' +
        breaks[i + 1].toLocaleString() + '</li>';
    legendList += classRange;

  }

  legendul.innerHTML = legendList;
}
