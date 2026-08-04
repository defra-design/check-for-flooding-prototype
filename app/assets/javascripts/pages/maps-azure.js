// ----------------------------------------------------
// Flood map prototype — Azure Maps version
// Converted from Leaflet
// ----------------------------------------------------

window.addEventListener("load", () => {

    if (!window.azureMapsKey) {
        console.error('Azure Maps API key not found. Please set FLOOD_APP_AZURE_MAPS_KEY environment variable.');
        return;
    }

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

    const map = new atlas.Map("myMap", {
        center: [-2.60, 51.45],
        zoom: 11,
        style: "satellite_road_labels",
        showLogo: false,
        showFeedbackLink: false,
        authOptions: {
            authType: "subscriptionKey",
            subscriptionKey: window.azureMapsKey
        }
    });

    // Azure Maps initializes asynchronously — sources, layers and markers
    // can only be added once the map fires its 'ready' event.
    map.events.add("ready", () => {

    map.controls.add(new atlas.control.ZoomControl(), {
        position: "top-right"
    });

    // Allow arrow keys to control the map (Azure's default keyboard nav
    // already handles arrows/+/- once the map container has focus)
    const mapContainer = map.getMapContainer();
    mapContainer.setAttribute("tabindex", "0");
    mapContainer.addEventListener("click", () => {
        mapContainer.focus();
    });

    let selectedFloodAreaId = null;
    let selectedStationMarker = null;
    let stationMarkers = []; // { marker, el, station }
    let shapeClickHandledThisTick = false;

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

        updateStatusItem(status);

    }

    const severityConfig = {
        "Flood alert": {
            className: 'defra-flood-status-item--alert',
            message: 'Flooding is possible - <a class="govuk-link" href="https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do#flood-alert">be prepared</a>'
        },
        "Flood warning": {
            className: 'defra-flood-status-item--warning',
            message: 'Flooding is expected - <a class="govuk-link" href="https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do#flood-warning">act now</a>'
        },
        "Severe flood warning": {
            className: 'defra-flood-status-item--severe',
            message: 'Danger to life - <a class="govuk-link" href="https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do#severe-flood-warning">act now</a>'
        }
    };

    function updateStatusItem(status) {

        const statusItem = document.getElementById('statusItem');
        const statusMessage = document.getElementById('statusMessage');
        const config = severityConfig[status];

        if (!statusItem || !statusMessage) return;

        statusItem.classList.remove(
            'defra-flood-status-item--alert',
            'defra-flood-status-item--warning',
            'defra-flood-status-item--severe'
        );

        if (!config) {
            statusItem.style.display = 'none';
            return;
        }

        statusItem.style.display = '';
        statusItem.classList.add(config.className);
        statusItem.setAttribute('data-severity-status', status);
        statusMessage.innerHTML = config.message;

    }

    //--------------------------------------------------
    // HELPERS
    //--------------------------------------------------

    function getStatusColour(status) {

        switch (status) {
            case "Severe flood warning":
                return floodColours.severe;
            case "Flood warning":
                return floodColours.warning;
            case "Flood alert":
                return floodColours.alert;
            default:
                return floodColours.normal;
        }

    }

    function baseFillOpacity(severity) {

        if (severity === "Flood alert") return 0.30;
        if (severity === "Flood warning") return 0.35;
        if (severity === "Severe flood warning") return 0.45;
        return 0.20;

    }

    function showSeverity(severity) {

        switch (severity) {
            case "Severe flood warning":
                return document.getElementById("toggleSevere").checked;
            case "Flood warning":
                return document.getElementById("toggleWarning").checked;
            case "Flood alert":
                return document.getElementById("toggleAlert").checked;
            default:
                return true;
        }

    }

    //--------------------------------------------------
    // FLOOD AREAS (data source + declarative layers)
    //--------------------------------------------------

    const floodDataSource = new atlas.source.DataSource();
    map.sources.add(floodDataSource);

    // displayState drives styling: "normal" | "hover" | "selected" | "hidden"
    // set per-feature via shape.setProperties(...) and read back via
    // data-driven expressions on the layers below.

    const floodFillLayer = new atlas.layer.PolygonLayer(floodDataSource, "floodFillLayer", {
        fillColor: [
            "case",
            ["==", ["get", "severity"], "Severe flood warning"], floodColours.severe,
            ["==", ["get", "severity"], "Flood warning"], floodColours.warning,
            ["==", ["get", "severity"], "Flood alert"], floodColours.alert,
            floodColours.normal
        ],
        fillOpacity: [
            "case",
            ["==", ["get", "displayState"], "hidden"], 0,
            ["==", ["get", "displayState"], "selected"], 0.60,
            ["==", ["get", "displayState"], "hover"], ["get", "hoverOpacity"],
            ["get", "baseOpacity"]
        ]
    });

    const floodOutlineLayer = new atlas.layer.LineLayer(floodDataSource, "floodOutlineLayer", {
        strokeColor: [
            "case",
            ["==", ["get", "severity"], "Severe flood warning"], floodColours.severe,
            ["==", ["get", "severity"], "Flood warning"], floodColours.warning,
            ["==", ["get", "severity"], "Flood alert"], floodColours.alert,
            floodColours.normal
        ],
        strokeWidth: [
            "case",
            ["any",
                ["==", ["get", "displayState"], "hover"],
                ["==", ["get", "displayState"], "selected"]
            ], 4,
            2
        ],
        strokeOpacity: [
            "case",
            ["==", ["get", "displayState"], "hidden"], 0,
            1
        ]
    });

    map.layers.add([floodFillLayer, floodOutlineLayer]);

    function setFeatureDisplayState(shape, state) {

        const props = shape.getProperties();
        const severity = props.severity;

        shape.setProperties(Object.assign({}, props, {
            displayState: state,
            baseOpacity: baseFillOpacity(severity),
            hoverOpacity: Math.min(baseFillOpacity(severity) + 0.15, 0.7)
        }));

    }

    function refreshFloodAreas() {

        const shapes = floodDataSource.getShapes();

        shapes.forEach(shape => {

            const props = shape.getProperties();
            const visible = showSeverity(props.severity);
            const isSelected = shape.getId() === selectedFloodAreaId;

            if (!visible) {
                setFeatureDisplayState(shape, "hidden");
            } else if (isSelected) {
                setFeatureDisplayState(shape, "selected");
            } else {
                setFeatureDisplayState(shape, "normal");
            }

        });

    }

    fetch("/public/data/demo-flood-areas.geojson")

        .then(response => response.json())

        .then(data => {

            // Give every feature an id (used for tracking selection) and
            // seed the display-state properties before adding to the source.
            data.features.forEach((feature, index) => {

                feature.id = feature.id || `flood-area-${index}`;

                const severity = feature.properties.severity;

                feature.properties.displayState = "normal";
                feature.properties.baseOpacity = baseFillOpacity(severity);
                feature.properties.hoverOpacity = Math.min(baseFillOpacity(severity) + 0.15, 0.7);

            });

            floodDataSource.add(data);

            refreshFloodAreas();

            //----------------------------------------------
            // Hover / click behaviour for flood area layer
            //----------------------------------------------

            map.events.add("mousemove", floodFillLayer, e => {

                if (!e.shapes || !e.shapes.length) return;

                const shape = e.shapes[0];
                const props = shape.getProperties();

                if (shape.getId() === selectedFloodAreaId) return;
                if (!showSeverity(props.severity)) return;

                map.getCanvasContainer().style.cursor = "pointer";

                if (props.displayState !== "hover") {
                    setFeatureDisplayState(shape, "hover");
                }

            });

            map.events.add("mouseleave", floodFillLayer, () => {

                map.getCanvasContainer().style.cursor = "";

                floodDataSource.getShapes().forEach(shape => {

                    if (shape.getId() === selectedFloodAreaId) return;

                    const props = shape.getProperties();
                    const visible = showSeverity(props.severity);

                    setFeatureDisplayState(shape, visible ? "normal" : "hidden");

                });

            });

            map.events.add("click", floodFillLayer, e => {

                shapeClickHandledThisTick = true;

                if (!e.shapes || !e.shapes.length) return;

                const shape = e.shapes[0];
                const props = shape.getProperties();

                if (!showSeverity(props.severity)) return;

                if (selectedFloodAreaId) {

                    const previous = floodDataSource.getShapeById(selectedFloodAreaId);

                    if (previous) {
                        setFeatureDisplayState(previous, showSeverity(previous.getProperties().severity) ? "normal" : "hidden");
                    }

                }

                selectedFloodAreaId = shape.getId();
                setFeatureDisplayState(shape, "selected");

                openPanel();

                setPanel(
                    props.name,
                    `<strong>Status:</strong> ${props.severity}`,
                    props.severity
                );

            });

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
    // RIVER STATIONS (HtmlMarkers)
    //--------------------------------------------------

    fetch("/public/data/demo-river-stations.json")

        .then(response => response.json())

        .then(stations => {

            stations.forEach(station => {

                const el = document.createElement("div");
                el.className = "station-marker";

                const marker = new atlas.HtmlMarker({
                    position: [station.lng, station.lat],
                    htmlContent: el
                });

                map.markers.add(marker);

                stationMarkers.push({ marker, el, station });

                map.events.add("mouseenter", marker, () => {

                    if (marker !== selectedStationMarker) {
                        el.classList.add("is-hover");
                    }

                });

                map.events.add("mouseleave", marker, () => {

                    if (marker !== selectedStationMarker) {
                        el.classList.remove("is-hover");
                    }

                });

                map.events.add("click", marker, e => {

                    shapeClickHandledThisTick = true;

                    if (e && e.originalEvent) {
                        e.originalEvent.stopPropagation();
                    }

                    if (selectedStationMarker) {

                        const previous = stationMarkers.find(m => m.marker === selectedStationMarker);

                        if (previous) {
                            previous.el.classList.remove("is-selected", "is-hover");
                        }

                    }

                    selectedStationMarker = marker;
                    el.classList.add("is-selected");

                    openPanel();

                    setPanel(

                        station.name,

                        `<p class="govuk-body-s govuk-!-margin-bottom-2">
                        <strong>River:</strong> ${station.river}
                        </p><p class="govuk-body-s govuk-!-margin-bottom-2">
                        <strong>Current level:</strong> ${station.level}
                         </p><p class="govuk-body-s govuk-!-margin-bottom-2">
                        <strong>Status:</strong> ${station.status}</p>
                        `,

                        station.status

                    );

                });

            });

        });

    //--------------------------------------------------
    // CLEAR SELECTIONS (click on empty map)
    //--------------------------------------------------

    map.events.add("click", e => {

        // If a shape/marker click handler already ran for this click,
        // skip the "clicked empty map" deselect logic below.
        if (shapeClickHandledThisTick) {
            shapeClickHandledThisTick = false;
            return;
        }

        if (selectedFloodAreaId) {

            const previous = floodDataSource.getShapeById(selectedFloodAreaId);

            if (previous) {
                const props = previous.getProperties();
                setFeatureDisplayState(previous, showSeverity(props.severity) ? "normal" : "hidden");
            }

            selectedFloodAreaId = null;

        }

        if (selectedStationMarker) {

            const previous = stationMarkers.find(m => m.marker === selectedStationMarker);

            if (previous) {
                previous.el.classList.remove("is-selected", "is-hover");
            }

            selectedStationMarker = null;

        }

        infoPanel.classList.remove("open");

    });

    //--------------------------------------------------
    // LAYER TOGGLES — river stations
    //--------------------------------------------------

    document
        .getElementById("toggleStations")
        .addEventListener("change", function () {

            stationMarkers.forEach(({ marker }) => {
                marker.setOptions({ visible: this.checked });
            });

        });

    }); // end map.events.add("ready", ...)

});