import { useEffect, useState } from "react";
import "../styles/DailyRainfallPanel.css";

export default function DailyRainfallPanel({ selectedDate }) {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [district, setDistrict] = useState("All");
    const [page, setPage] = useState(1);

    const rowsPerPage = 25;


    /* =========================
       LOAD DATA
    ========================= */

    useEffect(() => {

        if (!selectedDate) {
            setData(null);
            return;
        }

        const loadData = async () => {

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/rainfall/daily/${selectedDate}/`
                );

                if (!response.ok) {
                    throw new Error("Failed to load rainfall data");
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(
                        result.message || "No data found"
                    );
                }

                setData(result);
                setSearch("");
                setDistrict("All");
                setPage(1);

            } catch (err) {

                console.error(err);
                setError(err.message);

            } finally {

                setLoading(false);

            }

        };

        loadData();

    }, [selectedDate]);


    /* =========================
       STATES
    ========================= */

    if (!selectedDate) {
        return (
            <div className="daily-empty">
                <h3>Select a date</h3>

                <p>
                    Click a date from the calendar to view
                    detailed rainfall information.
                </p>
            </div>
        );
    }


    if (loading) {
        return (
            <div className="daily-loading">
                Loading rainfall data for{" "}
                <strong>{selectedDate}</strong>...
            </div>
        );
    }


    if (error) {
        return (
            <div className="daily-error">
                <h3>Unable to load data</h3>
                <p>{error}</p>
            </div>
        );
    }


    if (!data) return null;


    /* =========================
       DATA
    ========================= */

    const summary = data.summary || {};
    const mandals = data.mandals || [];
    const districts = data.districts || [];


    /* =========================
       DISTRICT FILTER
    ========================= */

    const districtsList = [
        "All",
        ...new Set(
            mandals
                .map(item => item.district)
                .filter(Boolean)
        )
    ];


    /* =========================
       FILTER MANDALS
    ========================= */

    const filtered = mandals.filter(item => {

        const text =
            `${item.mandal || ""} ${item.district || ""}`
                .toLowerCase();

        return (
            text.includes(search.toLowerCase()) &&
            (
                district === "All" ||
                item.district === district
            )
        );

    });


    /* =========================
       PAGINATION
    ========================= */

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / rowsPerPage)
    );

    const safePage = Math.min(
        page,
        totalPages
    );

    const start =
        (safePage - 1) * rowsPerPage;

    const visibleMandals =
        filtered.slice(
            start,
            start + rowsPerPage
        );


    /* =========================
       SUMMARY
    ========================= */

    const rainMandals = mandals.filter(
        item =>
            Number(item.rainfall_mm || 0) > 0
    ).length;

    const noRainMandals =
        mandals.length - rainMandals;

    const wettest =
        data.wettest_district?.district ||
        districts[0]?.district ||
        "—";


    /* =========================
       RENDER
    ========================= */

    return (

        <div className="daily-analysis">


            {/* ====================================================
                SELECTED DATE
            ==================================================== */}

            <div className="selected-date-header">

                <div>

                    <span className="selected-label">
                        SELECTED DATE
                    </span>

                    <h3>
                        {selectedDate}
                    </h3>

                </div>

                <div className="date-badge">
                    2022
                </div>

            </div>


            {/* ====================================================
                KPI CARDS
            ==================================================== */}

            <div className="daily-kpi-grid">

                <KPI
                    label="TOTAL RAINFALL"
                    value={summary.total_rainfall}
                    unit="mm"
                />

                <KPI
                    label="AVERAGE RAINFALL"
                    value={summary.average_rainfall}
                    unit="mm"
                />

                <KPI
                    label="HIGHEST RAINFALL"
                    value={summary.highest_rainfall}
                    unit="mm"
                />

                <KPI
                    label="TOTAL MANDALS"
                    value={mandals.length}
                />

            </div>


            {/* ====================================================
                SUMMARY
            ==================================================== */}

            <div className="daily-summary-row">

                <Summary
                    label="RAIN RECEIVING"
                    value={rainMandals}
                    unit="Mandals"
                />

                <Summary
                    label="NO RAIN"
                    value={noRainMandals}
                    unit="Mandals"
                />

                <Summary
                    label="WETTEST DISTRICT"
                    value={wettest}
                />

                <Summary
                    label="AVG MAX HUMIDITY"
                    value={
                        Number(
                            summary.average_max_humidity || 0
                        ).toFixed(1)
                    }
                    unit="%"
                />

            </div>


            {/* ====================================================
                TOP 5 MANDALS
                MOVED ABOVE MANDAL ANALYSIS
            ==================================================== */}

            <section className="top-five-section">

                <div className="section-header">

                    <div>

                        <span>
                            QUICK INSIGHT
                        </span>

                        <h3>
                            Top 5 Highest Rainfall Mandals
                        </h3>

                    </div>

                    <div className="mandal-count">
                        Top 5
                    </div>

                </div>


                <div className="top-five-grid">

                    {mandals
                        .slice(0, 5)
                        .map((item, index) => (

                            <div
                                className="top-five-card"
                                key={`${item.district}-${item.mandal}-${index}`}
                            >

                                <span className="top-five-rank">
                                    #{item.rank}
                                </span>


                                <div className="top-five-info">

                                    <strong>
                                        {item.mandal}
                                    </strong>

                                    <span>
                                        {item.district}
                                    </span>

                                </div>


                                <strong className="top-five-rain">

                                    {Number(
                                        item.rainfall_mm || 0
                                    ).toFixed(1)}

                                    <small>
                                        {" "}mm
                                    </small>

                                </strong>

                            </div>

                        ))}

                </div>

            </section>


            {/* ====================================================
                ALL MANDAL ANALYSIS
            ==================================================== */}

            <section className="top-mandals-section">

                <div className="section-header">

                    <div>

                        <span>
                            MANDAL ANALYSIS
                        </span>

                        <h3>
                            All Mandals
                        </h3>

                    </div>


                    <div className="mandal-count">

                        {filtered.length} Mandals

                    </div>

                </div>


                {/* FILTERS */}

                <div className="mandal-filters">

                    <div className="mandal-search">

                        <input
                            type="text"
                            placeholder="Search mandal or district..."
                            value={search}
                            onChange={e => {

                                setSearch(
                                    e.target.value
                                );

                                setPage(1);

                            }}
                        />

                    </div>


                    <div className="district-filter">

                        <select
                            value={district}
                            onChange={e => {

                                setDistrict(
                                    e.target.value
                                );

                                setPage(1);

                            }}
                        >

                            {districtsList.map(
                                item => (

                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </div>


                {/* FIXED SCROLLABLE TABLE */}

                <div className="mandal-table-wrapper">

                    <table className="mandal-table">

                        <thead>

                            <tr>

                                <th>
                                    Rank
                                </th>

                                <th>
                                    Mandal
                                </th>

                                <th>
                                    District
                                </th>

                                <th>
                                    Rainfall
                                </th>

                                <th>
                                    Min Humidity
                                </th>

                                <th>
                                    Max Humidity
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {visibleMandals.length > 0 ? (

                                visibleMandals.map(
                                    (item, index) => (

                                        <tr
                                            key={`${item.district}-${item.mandal}-${index}`}
                                        >

                                            <td>

                                                <span className="rank-badge">
                                                    #{item.rank}
                                                </span>

                                            </td>


                                            <td>

                                                <strong>
                                                    {item.mandal}
                                                </strong>

                                            </td>


                                            <td>

                                                <span className="district-name">
                                                    {item.district}
                                                </span>

                                            </td>


                                            <td>

                                                <strong className="rainfall-value">

                                                    {Number(
                                                        item.rainfall_mm || 0
                                                    ).toFixed(1)}

                                                    <small>
                                                        {" "}mm
                                                    </small>

                                                </strong>

                                            </td>


                                            <td>

                                                {Number(
                                                    item.min_humidity || 0
                                                ).toFixed(1)}

                                                %

                                            </td>


                                            <td>

                                                {Number(
                                                    item.max_humidity || 0
                                                ).toFixed(1)}

                                                %

                                            </td>

                                        </tr>

                                    )

                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="no-results"
                                    >
                                        No mandals found.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* PAGINATION */}

                <div className="mandal-pagination">

                    <span>

                        Showing{" "}

                        {filtered.length
                            ? start + 1
                            : 0}

                        {" - "}

                        {Math.min(
                            start + rowsPerPage,
                            filtered.length
                        )}

                        {" of "}

                        {filtered.length}

                    </span>


                    <div className="pagination-buttons">

                        <button
                            disabled={
                                safePage === 1
                            }
                            onClick={() =>
                                setPage(
                                    p => p - 1
                                )
                            }
                        >
                            Previous
                        </button>


                        <span>
                            {safePage} / {totalPages}
                        </span>


                        <button
                            disabled={
                                safePage === totalPages
                            }
                            onClick={() =>
                                setPage(
                                    p => p + 1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
}


/* ============================================================
   KPI
============================================================ */

function KPI({ label, value, unit }) {

    return (

        <div className="daily-kpi-card">

            <div>

                <span>
                    {label}
                </span>

                <strong>

                    {Number(
                        value || 0
                    ).toFixed(
                        unit ? 1 : 0
                    )}

                    {unit && (
                        <small>
                            {" "}{unit}
                        </small>
                    )}

                </strong>

            </div>

        </div>
    );
}


/* ============================================================
   SUMMARY
============================================================ */

function Summary({
    label,
    value,
    unit
}) {

    return (

        <div className="summary-mini-card">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

            {unit && (
                <small>
                    {unit}
                </small>
            )}

        </div>
    );
}