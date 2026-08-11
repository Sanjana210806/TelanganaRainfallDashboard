import { useEffect, useState } from "react";

import "../styles/monthly-district-rainfall.css";


function MonthlyDistrictRainfall({ district }) {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    /* ============================================================
       LOAD DISTRICT MONTHLY DATA
    ============================================================ */

    useEffect(() => {

        if (!district) {

            setData([]);

            return;

        }


        const loadData = async () => {

            try {

                setLoading(true);
                setError("");


                const response = await fetch(
                    `/api/rainfall/district/${encodeURIComponent(
                        district
                    )}/`
                );


                if (!response.ok) {

                    throw new Error(
                        "Unable to load district rainfall."
                    );

                }


                const result =
                    await response.json();


                if (!result.success) {

                    throw new Error(
                        result.message ||
                        "No rainfall data found."
                    );

                }


                setData(
                    result.monthly_rainfall || []
                );

            }

            catch (err) {

                console.error(
                    "Monthly district rainfall:",
                    err
                );


                setError(
                    "Unable to load monthly rainfall."
                );

            }

            finally {

                setLoading(false);

            }

        };


        loadData();

    }, [district]);


    /* ============================================================
       EMPTY
    ============================================================ */

    if (!district) {

        return (

            <div className="monthly-chart-empty">

                Select a district from the map.

            </div>

        );

    }


    /* ============================================================
       LOADING
    ============================================================ */

    if (loading) {

        return (

            <div className="monthly-chart-empty">

                Loading rainfall...

            </div>

        );

    }


    /* ============================================================
       ERROR
    ============================================================ */

    if (error) {

        return (

            <div className="monthly-chart-error">

                {error}

            </div>

        );

    }


    /* ============================================================
       MAX VALUE
    ============================================================ */

    const values = data.map(
        item =>
            Number(
                item.rainfall_mm || 0
            )
    );


    const maxRainfall = Math.max(
        ...values,
        1
    );


    /* ============================================================
       Y AXIS SCALE
    ============================================================ */

    const scaleStep =
        maxRainfall <= 50
            ? 10
            : maxRainfall <= 100
                ? 20
                : maxRainfall <= 250
                    ? 50
                    : 100;


    const scaleMax =
        Math.ceil(
            maxRainfall / scaleStep
        ) * scaleStep;


    const yAxisValues = [];


    for (
        let value = scaleMax;
        value >= 0;
        value -= scaleStep
    ) {

        yAxisValues.push(value);

    }


    /* ============================================================
       CHART
    ============================================================ */

    return (

        <div className="monthly-rainfall-content">


            {/* ====================================================
                CHART TITLE
            ==================================================== */}

            <div className="monthly-chart-title">

                <span>
                    MONTHLY RAINFALL
                </span>


                <strong>
                    {district}
                </strong>

            </div>


            {/* ====================================================
                CHART
            ==================================================== */}

            <div className="monthly-chart">


                {/* =================================================
                    Y AXIS
                ================================================= */}

                <div className="monthly-y-axis">

                    {yAxisValues.map(
                        (value) => (

                            <span
                                key={value}
                            >
                                {value}
                            </span>

                        )
                    )}

                </div>


                {/* =================================================
                    CHART AREA
                ================================================= */}

                <div className="monthly-chart-area">


                    {/* =================================================
                        GRID LINES
                    ================================================= */}

                    <div className="monthly-grid-lines">

                        {yAxisValues.map(
                            (value) => (

                                <div
                                    key={value}
                                    className="monthly-grid-line"
                                    style={{
                                        bottom:
                                            `${(
                                                value /
                                                scaleMax
                                            ) * 100}%`
                                    }}
                                />

                            )
                        )}

                    </div>


                    {/* =================================================
                        BARS
                    ================================================= */}

                    <div className="monthly-bars">

                        {data.map((item) => {

                            const value =
                                Number(
                                    item.rainfall_mm ||
                                    0
                                );


                            const height =
                                scaleMax > 0
                                    ? (
                                        value /
                                        scaleMax
                                    ) * 100
                                    : 0;


                            const monthName =
                                item.month_name ||
                                item.month ||
                                "";


                            return (

                                <div
                                    className="monthly-bar-column"
                                    key={
                                        item.month ||
                                        monthName
                                    }
                                >


                                    {/* =================================
                                        BAR
                                    ================================= */}

                                    <div
                                        className="monthly-bar-wrapper"
                                    >

                                        <div
                                            className="monthly-bar"
                                            style={{
                                                height:
                                                    `${height}%`
                                            }}
                                        >

                                            {/* TOOLTIP */}

                                            <div className="monthly-bar-tooltip">

                                                <strong>
                                                    {monthName}
                                                </strong>


                                                <span>
                                                    {value.toFixed(1)}
                                                    {" "}mm
                                                </span>

                                            </div>

                                        </div>

                                    </div>


                                    {/* =================================
                                        MONTH LABEL
                                    ================================= */}

                                    <span className="monthly-month-label">

                                        {monthName.slice(
                                            0,
                                            3
                                        )}

                                    </span>

                                </div>

                            );

                        })}

                    </div>

                </div>

            </div>

        </div>

    );

}


export default MonthlyDistrictRainfall;