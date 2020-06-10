let quake_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
let fault_URL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
render_map(quake_URL, fault_URL);

function render_map(quake_URL, fault_URL) {
  d3.json(quake_URL, function(data) {
    console.log(quake_URL)
    let earth_quake_data = data;
    d3.json(fault_URL, function(data) {
      let fault_line_data = data;
      create_features(earth_quake_data, fault_line_data);
    });
  });

  function create_features(earth_quake_data, fault_line_data) {
    function quake_layer(feature, layer) {
      return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
        fillOpacity: 1,
        color: pick_color(feature.properties.mag),
        fillColor: pick_color(feature.properties.mag),
        radius:  marker_size(feature.properties.mag)
      });
    }
    function each_earthquake(feature, layer) {
      layer.bindPopup("<h3>" + feature.properties.place + "</h3><hr><p>" + new Date(feature.properties.time) + "</p><hr><p>Magnitude: " + feature.properties.mag + "</p>");
    }

    function each_faultline(feature, layer) {
      L.polyline(feature.geometry.coordinates);
    }

    let earthquakes = L.geoJSON(earth_quake_data, {
      onEachFeature: each_earthquake,
      pointToLayer: quake_layer
    });

    let faultLines = L.geoJSON(fault_line_data, {
      onEachFeature: each_faultline,
      style: {
        weight: 2,
        color: 'blue'
      }
    });

    let time_layer = L.timeline(earth_quake_data, {
      getInterval: function(feature) {
        return {
          start: feature.properties.time,
          end: feature.properties.time + feature.properties.mag * 10000000
        };
      },
      pointToLayer: quake_layer,
      onEachFeature: each_earthquake
    });
    create_mapping(earthquakes, faultLines, time_layer);
  }

  function create_mapping(earthquakes, faultLines, time_layer) {
    let outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiZGF2aXNjYXJkd2VsbCIsImEiOiJjamViam4yMHEwZHJ4MnJvN3kweGhkeXViIn0." +
        "A3IKm_S6COZzvBMTqLvukQ");
    let satellite = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiZGF2aXNjYXJkd2VsbCIsImEiOiJjamViam4yMHEwZHJ4MnJvN3kweGhkeXViIn0." +
        "A3IKm_S6COZzvBMTqLvukQ");
    let dark_map = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiZGF2aXNjYXJkd2VsbCIsImEiOiJjamViam4yMHEwZHJ4MnJvN3kweGhkeXViIn0." +
        "A3IKm_S6COZzvBMTqLvukQ");
    let base_maps = {
      "Outdoors": outdoors,
      "Satellite": satellite,
      "Dark Map": dark_map,
    };

    let overlay_maps = {
      "Earthquakes": earthquakes,
      "Fault Lines": faultLines
    };

    let map = L.map("map", {
      center: [39.8283, -98.5785],
      zoom: 3,
      layers: [outdoors, faultLines],
      scrollWheelZoom: false
    });
    L.control.layers(base_maps, overlay_maps, {
      collapsed: true
    }).addTo(map);
    let legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
      let div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5],
        labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + pick_color(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }
      return div;
    };
    legend.addTo(map);
    let timeline = L.timelineSliderControl({
      formatOutput: function(date) {
        return new Date(date).toString();
      }
    });
    timeline.addTo(map);
    timeline.addTimelines(time_layer);
    time_layer.addTo(map);
  }
}
function pick_color(size) {
  return size > 5 ? "red":
    size > 4 ? "orange":
      size > 3 ? "gold":
        size > 2 ? "yellow":
          size > 1 ? "yellowgreen":
            "greenyellow"; // <= 1 default
}
function marker_size(size) {
  return size * 5;
}