import { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from "recharts";

import DistrictMap from "../components/DistrictMap";
import MandalSelector from "../components/MandalSelector";

import "../styles/mandal-analysis.css";

const PIE_COLORS = [
    "#8dbbdc",
    "#6f9fc4",
    "#4180b8",
    "#315779"
];

const RECORDS_PER_PAGE = 25;

function MandalAnalysis() {
    const [district, setDistrict] = useState(null);
    const [mandal, setMandal] = useState(null);
    const [data, setData] = useState(null);
    const [hoveredSeason, setHoveredSeason] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    /* ============================================================
       DISTRICT
    ============================================================ */

    const handleDistrict = value => {
        setDistrict(value);
        setMandal(null);
        setData(null);
        setHoveredSeason(null);
        setCurrentPage(1);
        setError("");
    };

    /* ============================================================
       MANDAL
    ============================================================ */

    const handleMandal = value => {
        setMandal(value);
        setHoveredSeason(null);
        setCurrentPage(1);
    };

    /* ============================================================
       CLEAR
    ============================================================ */

    const clearSelection = () => {
        setDistrict(null);
        setMandal(null);
        setData(null);
        setHoveredSeason(null);
        setCurrentPage(1);
        setError("");
    };

    /* ============================================================
       LOAD MANDAL DATA
    ============================================================ */

    useEffect(() => {
        if (!district || !mandal) {
            setData(null);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");
                setCurrentPage(1);

                const response = await fetch(
                    `/api/rainfall/district/${encodeURIComponent(
                        district
                    )}/mandal/${encodeURIComponent(mandal)}/`
                );

                if (!response.ok) {
                    throw new Error(
                        `API error: ${response.status}`
                    );
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(
                        result.message ||
                        "No mandal data found."
                    );
                }

                setData(result);
            } catch (err) {
                console.error(
                    "Mandal data error:",
                    err
                );

                setData(null);
                setError(
                    "Unable to load mandal rainfall data."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [district, mandal]);

    /* ============================================================
       MONTHLY MAX
    ============================================================ */

    const monthlyMax = data?.monthly_rainfall?.length
        ? Math.max(
            ...data.monthly_rainfall.map(
                item => Number(
                    item.rainfall_mm || 0
                )
            ),
            1
        )
        : 1;

    /* ============================================================
       DAILY PAGINATION
    ============================================================ */

    const dailyRecords =
        data?.daily_rainfall || [];

    const totalPages = Math.max(
        1,
        Math.ceil(
            dailyRecords.length /
            RECORDS_PER_PAGE
        )
    );

    const safePage = Math.min(
        currentPage,
        totalPages
    );

    const startIndex =
        (safePage - 1) *
        RECORDS_PER_PAGE;

    const endIndex = Math.min(
        startIndex + RECORDS_PER_PAGE,
        dailyRecords.length
    );

    const currentDailyRecords =
        dailyRecords.slice(
            startIndex,
            endIndex
        );

    /* ============================================================
       ALL PAGE NUMBERS
    ============================================================ */

    const pageNumbers = Array.from(
        { length: totalPages },
        (_, index) => index + 1
    );

    return (
        <div className="mandal-analysis-page">

            {/* ====================================================
               HEADER
            ==================================================== */}

            <section className="mandal-page-header">

                <div>

                    <p className="mandal-eyebrow">
                        MANDAL LEVEL ANALYSIS
                    </p>

                    <h1>
                        Telangana Mandal Analysis
                    </h1>

                    <p>
                        Select a district and mandal to
                        explore detailed rainfall patterns.
                    </p>

                </div>

                {mandal && (

                    <div className="mandal-selection-info">

                        <span>
                            SELECTED MANDAL
                        </span>

                        <strong>
                            {mandal}
                        </strong>

                    </div>

                )}

            </section>


            {/* ====================================================
               MAP + MANDAL SELECTOR
            ==================================================== */}

            <div className="mandal-analysis-grid">

                {/* MAP */}

                <section className="mandal-map-card">

                    <div className="mandal-section-header">

                        <div>

                            <span>
                                GEOGRAPHICAL VIEW
                            </span>

                            <h2>
                                Telangana Districts
                            </h2>

                        </div>

                        {district ? (

                            <button
                                type="button"
                                onClick={clearSelection}
                            >
                                Clear Selection
                            </button>

                        ) : (

                            <span className="mandal-map-hint">
                                Click a district to analyse
                            </span>

                        )}

                    </div>

                    <DistrictMap
                        selectedDistrict={district}
                        onDistrictSelect={handleDistrict}
                    />

                </section>


                {/* MANDAL SELECTOR */}

                <section className="mandal-selector-card">

                    <div className="mandal-section-header">

                        <div>

                            <span>
                                MANDAL SELECTION
                            </span>

                            <h2>
                                Select Mandal
                            </h2>

                        </div>

                    </div>

                    <MandalSelector
                        district={district}
                        selectedMandal={mandal}
                        onMandalSelect={handleMandal}
                    />

                </section>

            </div>


            {/* ====================================================
               DATA
            ==================================================== */}

            {mandal && (

                <section className="mandal-data-card">

                    <div className="mandal-section-header">

                        <div>

                            <span>
                                MANDAL SUMMARY
                            </span>

                            <h2>
                                Rainfall Overview
                            </h2>

                        </div>

                        <strong>
                            {district}
                        </strong>

                    </div>


                    {/* LOADING */}

                    {loading && (

                        <div className="mandal-data-state">
                            Loading rainfall data...
                        </div>

                    )}


                    {/* ERROR */}

                    {!loading && error && (

                        <div className="mandal-data-error">
                            {error}
                        </div>

                    )}


                    {/* DATA */}

                    {!loading &&
                        !error &&
                        data && (

                        <>

                            {/* =================================================
                                KPI CARDS
                            ================================================= */}

                            <div className="mandal-kpis">

                                <div className="mandal-kpi">

                                    <span>
                                        TOTAL RAINFALL
                                    </span>

                                    <strong>
                                        {Number(
                                            data.total_rainfall || 0
                                        ).toFixed(1)}

                                        <small>
                                            mm
                                        </small>

                                    </strong>

                                </div>


                                <div className="mandal-kpi">

                                    <span>
                                        AVERAGE RAINFALL
                                    </span>

                                    <strong>
                                        {Number(
                                            data.average_rainfall || 0
                                        ).toFixed(1)}

                                        <small>
                                            mm
                                        </small>

                                    </strong>

                                </div>


                                <div className="mandal-kpi">

                                    <span>
                                        HIGHEST RAINFALL
                                    </span>

                                    <strong>
                                        {Number(
                                            data.highest_rainfall || 0
                                        ).toFixed(1)}

                                        <small>
                                            mm
                                        </small>

                                    </strong>

                                </div>


                                <div className="mandal-kpi">

                                    <span>
                                        RAINY DAYS
                                    </span>

                                    <strong>
                                        {data.rainy_days || 0}

                                        <small>
                                            Days
                                        </small>

                                    </strong>

                                </div>


                                <div className="mandal-kpi date-kpi">

                                    <span>
                                        HIGHEST RAINFALL DATE
                                    </span>

                                    <strong>
                                        {data.highest_rainfall_date ||
                                            "—"}
                                    </strong>

                                </div>

                            </div>


                            {/* =================================================
                                MONTHLY + SEASONAL
                            ================================================= */}

                            <div className="mandal-chart-row">

                                {/* MONTHLY GRAPH */}

                                <div className="mandal-monthly-section">

                                    <div className="mandal-data-title">

                                        <span>
                                            MONTHLY ANALYSIS
                                        </span>

                                        <h3>
                                            Monthly Rainfall
                                        </h3>

                                    </div>


                                    {data.monthly_rainfall?.length ? (

                                        <div className="mandal-monthly-bars">

                                            {data.monthly_rainfall.map(
                                                item => {

                                                    const value =
                                                        Number(
                                                            item.rainfall_mm ||
                                                            0
                                                        );

                                                    const height =
                                                        (
                                                            value /
                                                            monthlyMax
                                                        ) * 100;

                                                    return (

                                                        <div
                                                            className="mandal-month"
                                                            key={
                                                                item.month
                                                            }
                                                        >

                                                            <div className="mandal-month-value">
                                                                {value.toFixed(
                                                                    1
                                                                )}
                                                            </div>

                                                            <div className="mandal-bar-area">

                                                                <div
                                                                    className="mandal-bar"
                                                                    style={{
                                                                        height:
                                                                            `${height}%`
                                                                    }}
                                                                />

                                                            </div>

                                                            <small>
                                                                {
                                                                    item.month
                                                                }
                                                            </small>

                                                        </div>

                                                    );
                                                }
                                            )}

                                        </div>

                                    ) : (

                                        <div className="mandal-empty">
                                            No monthly rainfall data
                                            available.
                                        </div>

                                    )}

                                </div>


                                {/* SEASONAL PIE */}

                                <div className="mandal-season-section">

                                    <div className="mandal-data-title">

                                        <span>
                                            SEASONAL ANALYSIS
                                        </span>

                                        <h3>
                                            Rainfall by Season
                                        </h3>

                                    </div>


                                    {data.seasonal_rainfall?.length ? (

                                        <div className="mandal-pie-wrapper">

                                            <div className="mandal-pie-chart">

                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={230}
                                                >

                                                    <PieChart>

                                                        <Pie
                                                            data={
                                                                data.seasonal_rainfall
                                                            }
                                                            dataKey="rainfall_mm"
                                                            nameKey="season"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={78}
                                                            innerRadius={38}
                                                            paddingAngle={2}
                                                            onMouseEnter={
                                                                (_, index) =>
                                                                    setHoveredSeason(
                                                                        data.seasonal_rainfall[
                                                                            index
                                                                        ]
                                                                    )
                                                            }
                                                            onMouseLeave={() =>
                                                                setHoveredSeason(
                                                                    null
                                                                )
                                                            }
                                                        >

                                                            {data.seasonal_rainfall.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (

                                                                    <Cell
                                                                        key={
                                                                            item.season
                                                                        }
                                                                        fill={
                                                                            PIE_COLORS[
                                                                                index %
                                                                                PIE_COLORS.length
                                                                            ]
                                                                        }
                                                                    />

                                                                )
                                                            )}

                                                        </Pie>

                                                        <Tooltip
                                                            content={() =>
                                                                null
                                                            }
                                                        />

                                                    </PieChart>

                                                </ResponsiveContainer>

                                            </div>


                                            {/* HOVER DETAILS */}

                                            <div className="season-hover-info">

                                                {hoveredSeason ? (

                                                    <>

                                                        <strong>
                                                            {
                                                                hoveredSeason.season
                                                            }
                                                        </strong>

                                                        <span>
                                                            Months:{" "}
                                                            {(
                                                                hoveredSeason.months ||
                                                                []
                                                            ).join(
                                                                " • "
                                                            )}
                                                        </span>

                                                        <span>
                                                            Rainfall:{" "}
                                                            {Number(
                                                                hoveredSeason.rainfall_mm ||
                                                                0
                                                            ).toFixed(
                                                                1
                                                            )}{" "}
                                                            mm
                                                        </span>

                                                        <span>
                                                            Share:{" "}
                                                            {Number(
                                                                hoveredSeason.percentage ||
                                                                0
                                                            ).toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>

                                                        <span>
                                                            Avg Rainfall:{" "}
                                                            {Number(
                                                                hoveredSeason.average_rainfall ||
                                                                0
                                                            ).toFixed(
                                                                1
                                                            )}{" "}
                                                            mm/day
                                                        </span>

                                                        <span>
                                                            Rainy Days:{" "}
                                                            {
                                                                hoveredSeason.rainy_days ||
                                                                0
                                                            }
                                                        </span>

                                                        <span>
                                                            Dry Days:{" "}
                                                            {
                                                                hoveredSeason.dry_days ||
                                                                0
                                                            }
                                                        </span>

                                                        <span>
                                                            Rainy Ratio:{" "}
                                                            {Number(
                                                                hoveredSeason.rainy_day_ratio ||
                                                                0
                                                            ).toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>

                                                        <span>
                                                            Humidity:{" "}
                                                            {Number(
                                                                hoveredSeason.average_min_humidity ||
                                                                0
                                                            ).toFixed(
                                                                1
                                                            )}
                                                            % –{" "}
                                                            {Number(
                                                                hoveredSeason.average_max_humidity ||
                                                                0
                                                            ).toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>

                                                    </>

                                                ) : (

                                                    <span>
                                                        Hover over a season
                                                        to view details.
                                                    </span>

                                                )}

                                            </div>


                                            {/* LEGEND */}

                                            <div className="season-legend">

                                                {data.seasonal_rainfall.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <div
                                                            key={
                                                                item.season
                                                            }
                                                        >

                                                            <i
                                                                style={{
                                                                    background:
                                                                        PIE_COLORS[
                                                                            index %
                                                                            PIE_COLORS.length
                                                                        ]
                                                                }}
                                                            />

                                                            <span>
                                                                {
                                                                    item.season
                                                                }
                                                            </span>

                                                            <strong>
                                                                {Number(
                                                                    item.percentage ||
                                                                    0
                                                                ).toFixed(
                                                                    1
                                                                )}
                                                                %
                                                            </strong>

                                                        </div>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                    ) : (

                                        <div className="mandal-empty">
                                            No seasonal data available.
                                        </div>

                                    )}

                                </div>

                            </div>


                            {/* =================================================
                                DAILY RAINFALL
                            ================================================= */}

                            <div className="mandal-daily-section">

                                <div className="mandal-data-title">

                                    <span>
                                        DAILY RECORDS
                                    </span>

                                    <h3>
                                        Daily Rainfall
                                    </h3>

                                </div>


                                {dailyRecords.length ? (

                                    <>

                                        <div className="mandal-daily-scroll">

                                            <table>

                                                <thead>

                                                    <tr>

                                                        <th>
                                                            #
                                                        </th>

                                                        <th>
                                                            Date
                                                        </th>

                                                        <th>
                                                            Rainfall
                                                        </th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {currentDailyRecords.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (

                                                            <tr
                                                                key={`${item.date}-${index}`}
                                                            >

                                                                <td>
                                                                    {startIndex +
                                                                        index +
                                                                        1}
                                                                </td>

                                                                <td>
                                                                    {
                                                                        item.date
                                                                    }
                                                                </td>

                                                                <td>

                                                                    <strong>
                                                                        {Number(
                                                                            item.rainfall_mm ||
                                                                            0
                                                                        ).toFixed(
                                                                            1
                                                                        )}
                                                                    </strong>

                                                                    {" "}mm

                                                                </td>

                                                            </tr>

                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>


                                        {/* =================================================
                                            PAGINATION
                                        ================================================= */}

                                        {totalPages > 1 && (

                                            <div className="mandal-pagination">

                                                <button
                                                    type="button"
                                                    disabled={
                                                        safePage ===
                                                        1
                                                    }
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            page =>
                                                                Math.max(
                                                                    1,
                                                                    page -
                                                                        1
                                                                )
                                                        )
                                                    }
                                                >
                                                    Previous
                                                </button>


                                                <div className="mandal-page-numbers">

                                                    {pageNumbers.map(
                                                        page => (

                                                            <button
                                                                type="button"
                                                                key={
                                                                    page
                                                                }
                                                                className={
                                                                    safePage ===
                                                                    page
                                                                        ? "active"
                                                                        : ""
                                                                }
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        page
                                                                    )
                                                                }
                                                            >
                                                                {page}
                                                            </button>

                                                        )
                                                    )}

                                                </div>


                                                <button
                                                    type="button"
                                                    disabled={
                                                        safePage ===
                                                        totalPages
                                                    }
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            page =>
                                                                Math.min(
                                                                    totalPages,
                                                                    page +
                                                                        1
                                                                )
                                                        )
                                                    }
                                                >
                                                    Next
                                                </button>

                                            </div>

                                        )}


                                        <div className="mandal-page-info">

                                            Page{" "}
                                            {safePage}{" "}
                                            of{" "}
                                            {totalPages}
                                            {" • "}
                                            Showing{" "}
                                            {dailyRecords.length
                                                ? startIndex + 1
                                                : 0}
                                            –
                                            {endIndex}
                                            {" "}of{" "}
                                            {dailyRecords.length}
                                            {" "}records

                                        </div>

                                    </>

                                ) : (

                                    <div className="mandal-empty">
                                        No daily rainfall records
                                        available.
                                    </div>

                                )}

                            </div>

                        </>

                    )}

                </section>

            )}


            {/* ====================================================
               INITIAL INSTRUCTION
            ==================================================== */}

            {!district && (

                <section className="mandal-instruction">

                    <div>
                        MAP
                    </div>

                    <h3>
                        Select a District
                    </h3>

                    <p>
                        Click a district on the Telangana
                        map to view its mandals.
                    </p>

                </section>

            )}

        </div>
    );
}

export default MandalAnalysis;