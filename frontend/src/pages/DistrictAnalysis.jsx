import { useEffect, useState } from "react";

import DistrictMap from "../components/DistrictMap";
import MonthlyDistrictRainfall from "../components/MonthlyDistrictRainfall";
import DistrictDailyTable from "../components/DistrictDailyTable";

import "../styles/district-analysis.css";


function DistrictAnalysis() {

    const [selectedDistrict, setSelectedDistrict] =
        useState(null);

    const [districtData, setDistrictData] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    /* ============================================================
       HELPERS
    ============================================================ */

    const number = (value) => {

        const n = Number(value);

        return Number.isFinite(n)
            ? n.toFixed(1)
            : "—";

    };


    const rainfallValue = (item) => {

        return Number(
            item?.rain_mm ??
            item?.rainfall_mm ??
            item?.rainfall ??
            item?.rain ??
            0
        );

    };


    /* ============================================================
       LOAD DISTRICT DATA
    ============================================================ */

    useEffect(() => {

        if (!selectedDistrict) {

            setDistrictData(null);
            setError("");

            return;

        }


        const loadData = async () => {

            try {

                setLoading(true);
                setError("");
                setDistrictData(null);


                const response = await fetch(
                    `/api/rainfall/district/${encodeURIComponent(
                        selectedDistrict
                    )}/`
                );


                if (!response.ok) {

                    throw new Error(
                        `District API error: ${response.status}`
                    );

                }


                const result =
                    await response.json();


                console.log(
                    "District rainfall response:",
                    result
                );


                if (!result.success) {

                    throw new Error(
                        result.message ||
                        "No rainfall data found."
                    );

                }


                setDistrictData(result);

            }

            catch (err) {

                console.error(
                    "District data error:",
                    err
                );


                setError(
                    "Unable to load district rainfall data."
                );

            }

            finally {

                setLoading(false);

            }

        };


        loadData();

    }, [selectedDistrict]);


    /* ============================================================
       SELECT DISTRICT
    ============================================================ */

    const handleDistrictSelect = (district) => {

        console.log(
            "Selected District:",
            district
        );

        setSelectedDistrict(district);

    };


    /* ============================================================
       CLEAR DISTRICT
    ============================================================ */

    const clearDistrict = () => {

        setSelectedDistrict(null);

        setDistrictData(null);

        setError("");

    };


    /* ============================================================
       DATA
    ============================================================ */

    const summary =
        districtData?.summary || {};


    const mandals =
        districtData?.mandals || [];


    const daily =
        districtData?.daily_rainfall ||
        districtData?.daily ||
        districtData?.daily_data ||
        districtData?.data ||
        [];


    /* ============================================================
       HIGHEST RAINFALL DATE
    ============================================================ */

    const highestRainfallRecord =
        daily.reduce(
            (max, item) => {

                const value =
                    rainfallValue(item);


                if (
                    !max ||
                    value > max.value
                ) {

                    return {

                        value,

                        date:
                            item?.date ||
                            item?.rainfall_date ||
                            item?.day ||
                            null

                    };

                }


                return max;

            },
            null
        );


    const highestRainfallDate =
        summary.highest_rainfall_date ||
        summary.max_rainfall_date ||
        highestRainfallRecord?.date ||
        "—";


    /* ============================================================
       FORMAT DATE
    ============================================================ */

    const displayDate = (date) => {

        if (!date) {

            return "—";

        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return date;

        }


        return parsed.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    /* ============================================================
       PAGE
    ============================================================ */

    return (

        <div className="district-analysis-page">


            {/* ====================================================
               HEADER
            ==================================================== */}

            <section className="district-page-header">

                <div>

                    <p className="district-eyebrow">
                        DISTRICT LEVEL ANALYSIS
                    </p>


                    <h1>
                        Telangana District Analysis
                    </h1>


                    <p>
                        Explore rainfall patterns across
                        Telangana districts during 2022.
                        Select a district to view detailed
                        rainfall information.
                    </p>

                </div>


                {selectedDistrict && (

                    <div className="selected-district">

                        <span>
                            SELECTED DISTRICT
                        </span>


                        <strong>
                            {selectedDistrict}
                        </strong>

                    </div>

                )}

            </section>


            {/* ====================================================
               NO DISTRICT
            ==================================================== */}

            {!selectedDistrict && (

                <>

                    <div className="district-visual-grid">


                        {/* MAP */}

                        <section className="district-map-card">

                            <div className="district-section-header">

                                <div>

                                    <span>
                                        GEOGRAPHICAL VIEW
                                    </span>

                                    <h2>
                                        Telangana Districts
                                    </h2>

                                </div>


                                <div className="map-action">

                                    <span>
                                        Click a district to analyse
                                    </span>

                                </div>

                            </div>


                            <DistrictMap

                                selectedDistrict={
                                    null
                                }

                                onDistrictSelect={
                                    handleDistrictSelect
                                }

                            />

                        </section>


                        {/* MONTHLY */}

                        <section className="monthly-rainfall-card">

                            <div className="district-section-header">

                                <div>

                                    <span>
                                        MONTHLY ANALYSIS
                                    </span>

                                    <h2>
                                        Monthly Rainfall
                                    </h2>

                                </div>


                                <strong>
                                    2022
                                </strong>

                            </div>


                            <div className="monthly-rainfall-chart">

                                <MonthlyDistrictRainfall
                                    district={null}
                                />

                            </div>

                        </section>


                    </div>


                    <section className="district-instruction">

                        <div>
                            MAP
                        </div>


                        <h3>
                            Select a District
                        </h3>


                        <p>
                            Click any district on the Telangana
                            map to view its rainfall analysis.
                        </p>

                    </section>

                </>

            )}


            {/* ====================================================
               SELECTED DISTRICT
            ==================================================== */}

            {selectedDistrict && (

                <>


                    {/* =================================================
                       LOADING
                    ================================================= */}

                    {loading && (

                        <div className="district-loading-card">

                            Loading rainfall data for{" "}

                            <strong>
                                {selectedDistrict}
                            </strong>

                            ...

                        </div>

                    )}


                    {/* =================================================
                       ERROR
                    ================================================= */}

                    {!loading && error && (

                        <div className="district-error-card">

                            {error}

                        </div>

                    )}


                    {/* =================================================
                       DATA
                    ================================================= */}

                    {!loading &&
                        !error &&
                        districtData && (

                        <>


                            {/* =========================================
                               KPI CARDS
                            ========================================= */}

                            <section className="district-kpis">


                                <div className="district-kpi">

                                    <span>
                                        AVERAGE RAINFALL
                                    </span>

                                    <strong>
                                        {number(
                                            summary.average_rainfall
                                        )}
                                    </strong>

                                    <small>
                                        mm
                                    </small>

                                </div>


                                <div className="district-kpi">

                                    <span>
                                        HIGHEST RAINFALL
                                    </span>

                                    <strong>
                                        {number(
                                            summary.highest_rainfall
                                        )}
                                    </strong>

                                    <small>
                                        mm
                                    </small>

                                </div>


                                <div className="district-kpi">

                                    <span>
                                        LOWEST RAINFALL
                                    </span>

                                    <strong>
                                        {number(
                                            summary.lowest_rainfall
                                        )}
                                    </strong>

                                    <small>
                                        mm
                                    </small>

                                </div>


                                <div className="district-kpi">

                                    <span>
                                        RAINY DAYS
                                    </span>

                                    <strong>
                                        {
                                            summary.rainy_days ??
                                            "—"
                                        }
                                    </strong>

                                    <small>
                                        Days
                                    </small>

                                </div>


                            </section>


                            {/* =========================================
                               MAP + MONTHLY
                               60% / 40%
                            ========================================= */}

                            <div className="district-visual-grid">


                                {/* MAP — 60% */}

                                <section className="district-map-card">

                                    <div className="district-section-header">

                                        <div>

                                            <span>
                                                GEOGRAPHICAL VIEW
                                            </span>

                                            <h2>
                                                Telangana Districts
                                            </h2>

                                        </div>


                                        <div className="map-action">

                                            <button
                                                type="button"
                                                onClick={
                                                    clearDistrict
                                                }
                                            >
                                                Clear Selection
                                            </button>

                                        </div>

                                    </div>


                                    <DistrictMap

                                        selectedDistrict={
                                            selectedDistrict
                                        }

                                        onDistrictSelect={
                                            handleDistrictSelect
                                        }

                                    />

                                </section>


                                {/* MONTHLY — 40% */}

                                <section className="monthly-rainfall-card">

                                    <div className="district-section-header">

                                        <div>

                                            <span>
                                                MONTHLY ANALYSIS
                                            </span>

                                            <h2>
                                                Monthly Rainfall
                                            </h2>

                                        </div>


                                        <strong>
                                            2022
                                        </strong>

                                    </div>


                                    <div className="monthly-rainfall-chart">

                                        <MonthlyDistrictRainfall

                                            district={
                                                selectedDistrict
                                            }

                                        />

                                    </div>

                                </section>


                            </div>


                            {/* =========================================
                               DISTRICT SUMMARY
                            ========================================= */}

                            <section className="district-data-card">

                                <div className="district-section-header">

                                    <div>

                                        <span>
                                            DISTRICT SUMMARY
                                        </span>

                                        <h2>
                                            Rainfall Overview
                                        </h2>

                                    </div>


                                    <strong>
                                        {selectedDistrict}
                                    </strong>

                                </div>


                                <div className="district-summary-grid">


                                    <div className="district-summary-item">

                                        <span>
                                            TOTAL RAINFALL
                                        </span>

                                        <strong>
                                            {number(
                                                summary.total_rainfall
                                            )}
                                        </strong>

                                        <small>
                                            mm
                                        </small>

                                    </div>


                                    <div className="district-summary-item">

                                        <span>
                                            HIGHEST RAINFALL DATE
                                        </span>

                                        <strong className="summary-date">

                                            {displayDate(
                                                highestRainfallDate
                                            )}

                                        </strong>

                                    </div>


                                    <div className="district-summary-item">

                                        <span>
                                            MANDALS
                                        </span>

                                        <strong>
                                            {
                                                summary.mandal_count ??
                                                mandals.length ??
                                                "—"
                                            }
                                        </strong>

                                    </div>


                                </div>

                            </section>


                            {/* =========================================
                               DAILY RAINFALL
                            ========================================= */}

                            <section className="district-data-card">

    <div className="district-section-header">

        <div>
            <span>
                DAILY ANALYSIS
            </span>

            <h2>
                Daily Rainfall — 2022
            </h2>
        </div>

        <strong>
            {selectedDistrict}
        </strong>
    </div>

    <DistrictDailyTable
        district={selectedDistrict}
    />

</section>

                        </>

                    )}

                </>

            )}

        </div>

    );

}


export default DistrictAnalysis;