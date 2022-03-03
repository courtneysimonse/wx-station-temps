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
var breaks = [0, 20, 50, 75, 100, 150, 200, 366];
var colorize = chroma.scale('Spectral').domain([1,0]).classes(breaks).mode('lab');

slider.noUiSlider.on('update', function (values, handle) {
  // console.log(values);
  updateMap(values);
});



// GET DATA
processData();

// PROCESS DATA FUNCTION
function processData() {

  console.log(hexgrid);

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
  // console.log(temps);

  hexGridLayer.eachLayer(function (layer) {

    var dailyTemps = [];
    for (var prop in layer.feature.properties) {
      if (prop.search(/tmax_bydate/) != -1) {
        var maxTemp = layer.feature.properties[prop];
        var minTemp = layer.feature.properties[prop.replace("tmax","tmin")];
        if (minTemp >= temps[0] && maxTemp <= temps[1]) {
          dailyTemps.push(layer.feature.properties[prop]);
        }
      }
    }
    // console.log(dailyTemps);

    layer.feature.properties["days"] = dailyTemps.length;
    // var popupText = layer.feature.properties["days"].toString();
    // layer.bindPopup(popupText);

  });

  hexGridLayer.setStyle(style);


} // end updateMap()

function style (feature) {
  let color = 'lightgrey';
  if (feature.properties["days"] != undefined) {
    color = colorize(feature.properties["days"]);
  }
  return {
    fillColor: color,
    weight: 1.5,
    opacity: 1,
    color: 'grey',
    fillOpacity: 0.7
  };
}
