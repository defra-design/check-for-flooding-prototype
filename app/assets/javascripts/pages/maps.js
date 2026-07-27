// ----------------------------------------------------
// Flood map prototype
// Part 1 - Setup, helpers and panel
// ----------------------------------------------------

window.addEventListener("load", () => {

    //--------------------------------------------------
    // COLOURS
    //--------------------------------------------------

    const floodColours = {
        severe: "#8C1419",
        warning: "#D4351C",
        alert: "#F2A747",
        normal: "#00703C",
        station: "#5694ca",
        default: "#6F777B"
    };

    //--------------------------------------------------
    // MAP
    //--------------------------------------------------

    const map = L.map("myMap", {
        zoomControl: false,
        keyboard: true
    }).setView([51.45, -2.60], 11);

    L.control.zoom({
        position: "topright"
    }).addTo(map);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
            subdomains: "abcd",
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
        }
    ).addTo(map);

    setTimeout(() => map.invalidateSize(), 200);

    // Allow arrow keys to control the map
        const mapContainer = map.getContainer();

        mapContainer.setAttribute("tabindex", "0");

        mapContainer.addEventListener("click", () => {
            mapContainer.focus();
        });

    //--------------------------------------------------
    // LAYERS
    //--------------------------------------------------

    const floodAreaLayer = L.layerGroup().addTo(map);
    const stationLayer = L.layerGroup().addTo(map);

    let floodGeoJson = null;

    let selectedFloodArea = null;
    let selectedStation = null;

    //--------------------------------------------------
    // PANEL
    //--------------------------------------------------

    const infoPanel = document.getElementById("infoPanel");
    const closePanel = document.getElementById("closePanel");

    closePanel.addEventListener("click", () => {
        infoPanel.classList.remove("open");
    });

    function openPanel() {
        infoPanel.classList.add("open");
    }

    function setPanel(title, html, status) {

        document.getElementById("panelTitle").textContent = title;
        document.getElementById("panelDescription").innerHTML = html;

        const banner = document.getElementById("warningBanner");

        banner.textContent = status;
        banner.style.background = getStatusColour(status);

    }

    //--------------------------------------------------
    // HELPERS
    //--------------------------------------------------

    function getStatusColour(status) {

        switch (status) {

            case "Severe Flood Warning":
                return floodColours.severe;

            case "Flood Warning":
                return floodColours.warning;

            case "Flood Alert":
                return floodColours.alert;

            default:
                return floodColours.normal;

        }

    }

    function styleFloodArea(feature) {

        const colour = getStatusColour(feature.properties.severity);

        let opacity = 0.20;

        if (feature.properties.severity === "Flood Alert") {
            opacity = 0.30;
        }

        if (feature.properties.severity === "Flood Warning") {
            opacity = 0.35;
        }

        if (feature.properties.severity === "Severe Flood Warning") {
            opacity = 0.45;
        }

        return {
            color: colour,
            fillColor: colour,
            fillOpacity: opacity,
            weight: 2
        };

    }

    //--------------------------------------------------
    // FILTER FLOOD AREAS
    //--------------------------------------------------

    function showSeverity(severity) {

        switch (severity) {

            case "Severe Flood Warning":
                return document.getElementById("toggleSevere").checked;

            case "Flood Warning":
                return document.getElementById("toggleWarning").checked;

            case "Flood Alert":
                return document.getElementById("toggleAlert").checked;

            default:
                return true;
        }

    }

    function refreshFloodAreas() {

        if (!floodGeoJson) return;

        floodGeoJson.eachLayer(layer => {

            const visible = showSeverity(
                layer.feature.properties.severity
            );

            layer.setStyle({

                opacity: visible ? 1 : 0,

                fillOpacity: visible
                    ? styleFloodArea(layer.feature).fillOpacity
                    : 0

            });

        });

    }

        //--------------------------------------------------
    // FLOOD AREAS
    //--------------------------------------------------

    fetch("/public/data/demo-flood-areas.geojson")

        .then(response => response.json())

        .then(data => {

            floodGeoJson = L.geoJSON(data, {

                style: styleFloodArea,

                onEachFeature(feature, polygon) {

                    polygon.on({

                        mouseover() {

                            if (
                                selectedFloodArea !== polygon &&
                                showSeverity(feature.properties.severity)
                            ) {

                                polygon.setStyle({
                                    weight: 4,
                                    fillOpacity: Math.min(
                                    styleFloodArea(feature).fillOpacity + 0.15,
                                    0.7
                                )
                                });

                            }

                        },

                        mouseout() {

                            if (selectedFloodArea !== polygon) {

                                floodGeoJson.resetStyle(polygon);

                                if (!showSeverity(feature.properties.severity)) {

                                    polygon.setStyle({
                                        opacity: 0,
                                        fillOpacity: 0
                                    });

                                }

                            }

                        },

                        click(e) {

                            if (!showSeverity(feature.properties.severity)) {
                                return;
                            }

                            L.DomEvent.stopPropagation(e);

                            if (selectedFloodArea) {
                                floodGeoJson.resetStyle(selectedFloodArea);
                            }

                            selectedFloodArea = polygon;

const severity = feature.properties.severity;

                        polygon.setStyle({
                            weight: 4,
                            fillOpacity: 0.60,
                            color: getStatusColour(severity)
                        });

                        openPanel();

                        setPanel(

                            feature.properties.name,

                            `
                            <strong>Status:</strong> ${severity}
                            `,

                            severity

                        );

                            setPanel(

                                feature.properties.name,

                                `
                                <strong>Status:</strong> ${severity}
                                `,

                                severity

                            );

                        }

                    });

                }

            });

            floodGeoJson.addTo(floodAreaLayer);

            refreshFloodAreas();

        });

    //--------------------------------------------------
    // FLOOD WARNING FILTERS
    //--------------------------------------------------

    document
        .getElementById("toggleSevere")
        .addEventListener("change", refreshFloodAreas);

    document
        .getElementById("toggleWarning")
        .addEventListener("change", refreshFloodAreas);

    document
        .getElementById("toggleAlert")
        .addEventListener("change", refreshFloodAreas);

            //--------------------------------------------------
    // RIVER STATIONS
    //--------------------------------------------------

    fetch("/public/data/demo-river-stations.json")

        .then(response => response.json())

        .then(stations => {

            stations.forEach(station => {

                const marker = L.circleMarker(

                    [station.lat, station.lng],

                    {
                        radius: 8,
                        color: "#ffffff",
                        weight: 3,
                        fillColor: floodColours.station,
                        fillOpacity: 1
                    }

                );

                marker.on("mouseover", () => {

                    if (marker !== selectedStation) {

                        marker.setStyle({
                            radius: 11,
                            weight: 4
                        });

                    }

                });

                marker.on("mouseout", () => {

                    if (marker !== selectedStation) {

                        marker.setStyle({
                            radius: 8,
                            weight: 3
                        });

                    }

                });

                marker.on("click", e => {

                    L.DomEvent.stopPropagation(e);

                    if (selectedStation) {

                        selectedStation.setStyle({
                            radius: 8,
                            weight: 3
                        });

                    }

                    selectedStation = marker;

                    marker.setStyle({
                        radius: 12,
                        weight: 4
                    });

                    openPanel();

                    setPanel(

                        station.name,

                        `<p class="govuk-body govuk-!-margin-bottom-2">
                        <strong>River:</strong> ${station.river}
                        </p><p class="govuk-body govuk-!-margin-bottom-2">
                        <strong>Current level:</strong> ${station.level}
                         </p><p class="govuk-body govuk-!-margin-bottom-2">
                        <strong>Status:</strong> ${station.status}</p>
                        `,

                        station.status

                    );

                });

                marker.addTo(stationLayer);

            });

        });

    //--------------------------------------------------
    // CLEAR SELECTIONS
    //--------------------------------------------------

    map.on("click", () => {

        if (selectedFloodArea && floodGeoJson) {

            floodGeoJson.resetStyle(selectedFloodArea);

            if (!showSeverity(selectedFloodArea.feature.properties.severity)) {

                selectedFloodArea.setStyle({
                    opacity: 0,
                    fillOpacity: 0
                });

            }

            selectedFloodArea = null;

        }

        if (selectedStation) {

            selectedStation.setStyle({
                radius: 8,
                weight: 3
            });

            selectedStation = null;

        }

        infoPanel.classList.remove("open");

    });

    //--------------------------------------------------
    // LAYER TOGGLES
    //--------------------------------------------------

    document
        .getElementById("toggleStations")
        .addEventListener("change", function () {

            if (this.checked) {

                map.addLayer(stationLayer);

            } else {

                map.removeLayer(stationLayer);

            }

        });



});
