import { useEffect, useState } from "react";

import {
    MapContainer,
    GeoJSON,
    useMap
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import "../styles/district-map.css";


/* ============================================================
   FIT MAP TO TELANGANA
============================================================ */

function FitMap({ geoData }) {

    const map = useMap();

    useEffect(() => {

        if (!geoData) return;

        const geoJsonLayer =
            L.geoJSON(geoData);

        const bounds =
            geoJsonLayer.getBounds();

        if (!bounds.isValid()) return;


        map.fitBounds(
            bounds,
            {
                padding: [18, 18],
                animate: false
            }
        );

    }, [geoData, map]);

    return null;
}


/* ============================================================
   DISTRICT MAP
============================================================ */

function DistrictMap({
    selectedDistrict,
    onDistrictSelect
}) {

    const [geoData, setGeoData] =
        useState(null);

    const [error, setError] =
        useState("");


    /* ========================================================
       LOAD GEOJSON
    ======================================================== */

    useEffect(() => {

        fetch(
            "/data/telangana_districts.geojson"
        )

            .then((response) => {

                if (!response.ok) {

                    throw new Error(
                        `GeoJSON error: ${response.status}`
                    );

                }

                return response.json();

            })

            .then((data) => {

                console.log(
                    "Telangana GeoJSON:",
                    data
                );

                console.log(
                    "District count:",
                    data.features?.length
                );

                setGeoData(data);

            })

            .catch((err) => {

                console.error(
                    "GeoJSON loading error:",
                    err
                );

                setError(
                    "Unable to load Telangana district map."
                );

            });

    }, []);


    /* ========================================================
       DISTRICT NAME
    ======================================================== */

    const getDistrictName = (feature) => {

        const properties =
            feature?.properties || {};

        return (

            properties.shapeName ||

            properties.DISTRICT ||

            properties.District ||

            properties.district ||

            properties.NAME ||

            properties.Name ||

            properties.name ||

            "Unknown District"

        );

    };


    /* ========================================================
       DISTRICT STYLE
    ======================================================== */

    const getDistrictStyle = (feature) => {

        const district =
            getDistrictName(feature);

        const isSelected =
            district === selectedDistrict;

        return {

            fillColor:
                isSelected
                    ? "#4180b8"
                    : "#9fc6e2",

            fillOpacity:
                isSelected
                    ? 0.95
                    : 0.78,

            color:
                "#ffffff",

            weight:
                isSelected
                    ? 2.5
                    : 1.4,

            opacity:
                1

        };

    };


    /* ========================================================
       DISTRICT EVENTS
    ======================================================== */

    const handleDistrict = (
        feature,
        layer
    ) => {

        const district =
            getDistrictName(feature);


        /* -----------------------------------------------
           TOOLTIP
        ------------------------------------------------ */

        layer.bindTooltip(
            district,
            {
                sticky: true,
                direction: "top"
            }
        );


        /* -----------------------------------------------
           CLICK
        ------------------------------------------------ */

        layer.on(
            "click",
            () => {

                console.log(
                    "District selected:",
                    district
                );

                onDistrictSelect(
                    district
                );

            }
        );


        /* -----------------------------------------------
           HOVER
        ------------------------------------------------ */

        layer.on(
            "mouseover",
            () => {

                layer.setStyle({

                    fillColor:
                        "#5f9bc7",

                    fillOpacity:
                        0.96,

                    weight:
                        2.5

                });

                layer.bringToFront();

            }
        );


        /* -----------------------------------------------
           MOUSE OUT
        ------------------------------------------------ */

        layer.on(
            "mouseout",
            () => {

                layer.setStyle(
                    getDistrictStyle(
                        feature
                    )
                );

            }
        );

    };


    /* ========================================================
       LOADING
    ======================================================== */

    if (!geoData && !error) {

        return (

            <div className="district-map-state">

                <div className="map-spinner"></div>

                <p>
                    Loading Telangana districts...
                </p>

            </div>

        );

    }


    /* ========================================================
       ERROR
    ======================================================== */

    if (error) {

        return (

            <div className="district-map-state error">

                <strong>
                    Map could not be loaded
                </strong>

                <p>
                    {error}
                </p>

                <small>
                    Check the GeoJSON file inside:
                    <br />
                    public/data/
                </small>

            </div>

        );

    }


    /* ========================================================
       MAP
    ======================================================== */

    return (

        <div className="district-map-wrapper">

            <MapContainer

                center={[
                    17.95,
                    79.20
                ]}

                zoom={7}

                minZoom={6}

                maxZoom={10}

                scrollWheelZoom={false}

                zoomControl={false}

                attributionControl={false}

                className="district-leaflet-map"
            >

                <FitMap
                    geoData={geoData}
                />


                <GeoJSON

                    data={geoData}

                    style={
                        getDistrictStyle
                    }

                    onEachFeature={
                        handleDistrict
                    }

                />

            </MapContainer>


            {/* =================================================
                MAP INSTRUCTION
            ================================================= */}

            <div className="district-map-hint">

                <span className="hint-dot"></span>

                <span>
                    Click on a district to view rainfall analysis
                </span>

            </div>


            {/* =================================================
                MAP INFORMATION
            ================================================= */}

            <div className="district-map-info">

                <span className="map-dot"></span>

                <span>
                    {geoData.features?.length || 0}
                    {" "}Districts
                </span>

            </div>

        </div>

    );

}


export default DistrictMap;