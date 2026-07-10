function styleFloodArea(feature) {

    return {
        color: "#005ea5",
        weight: 1,
        fillColor: "#1d70b8",
        fillOpacity: 0.18
    };

}

window.addEventListener("load", () => {

    console.log("Loading map...");

    // Create map
    const map = L.map("myMap", {
        zoomControl: false
    }).setView([51.45, -2.60], 11);

    // Zoom buttons
    L.control.zoom({
        position: "topright"
    }).addTo(map);

    // Scale
    L.control.scale({
        imperial: false
    }).addTo(map);

    // Background map
    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
            subdomains: "abcd",
            maxZoom: 20,
            attribution: "&copy; OpenStreetMap &copy; CARTO"
        }
    ).addTo(map);

    // -----------------------------
    // Flood polygons
    // -----------------------------

    fetch("/public/data/demo-flood-areas.geojson")
        .then(response => response.json())
        .then(data => {

            console.log(`Loaded ${data.features.length} flood areas`);

            const floodLayer = L.geoJSON(data, {

                style: styleFloodArea,

                onEachFeature: function(feature, layer) {

                    layer.on({

                        mouseover: function(e) {

                            e.target.setStyle({
                                weight: 3,
                                fillOpacity: 0.5
                            });

                        },

                        mouseout: function(e) {

                            floodLayer.resetStyle(e.target);

                        }

                    });

                    layer.bindPopup(`
                        <strong>${feature.properties.name}</strong><br>
                        ${feature.properties.severity}
                    `);

                }

            }).addTo(map);

        });

    // -----------------------------
    // River stations
    // -----------------------------

    fetch("/public/data/demo-river-stations.json")
        .then(response => response.json())
        .then(stations => {

            console.log(`Loaded ${stations.length} stations`);

            stations.forEach(station => {

                L.circleMarker([station.lat, station.lng], {

                    radius: 6,
                    color: station.status === "Flood Warning"
                        ? "#d4351c"
                        : "#005ea5",

                    fillColor: station.status === "Flood Warning"
                        ? "#d4351c"
                        : "#1d70b8",

                    fillOpacity: 1,
                    weight: 2

                })
                .addTo(map)
                .bindPopup(`
                    <strong>${station.name}</strong><br>
                    ${station.river}<br><br>
                    Current level: <strong>${station.level}</strong><br>
                    Status: ${station.status}
                `);

            });

        });

});