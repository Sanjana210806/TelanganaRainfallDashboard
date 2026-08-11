import { useEffect, useState } from "react";
import "../styles/district-daily-table.css";

const ROWS_PER_PAGE = 25;

function DistrictDailyTable({ district }) {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!district) {
            setData([]);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");
                setPage(1);

                const response = await fetch(
                    `/api/rainfall/district/${encodeURIComponent(district)}/`
                );

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(
                        result.message || "No rainfall data found."
                    );
                }

                const records = (result.daily_rainfall || []).sort(
                    (a, b) =>
                        new Date(a.date) - new Date(b.date)
                );

                setData(records);
            } catch (err) {
                console.error("District daily rainfall:", err);
                setError("Unable to load daily rainfall data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [district]);

    if (!district) {
        return (
            <div className="district-daily-empty">
                Select a district to view daily rainfall.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="district-daily-empty">
                Loading daily rainfall...
            </div>
        );
    }

    if (error) {
        return (
            <div className="district-daily-error">
                {error}
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="district-daily-empty">
                No daily rainfall records available.
            </div>
        );
    }

    const totalPages = Math.ceil(
        data.length / ROWS_PER_PAGE
    );

    const start = (page - 1) * ROWS_PER_PAGE;

    const currentData = data.slice(
        start,
        start + ROWS_PER_PAGE
    );

    const goToPage = (number) => {
        if (number >= 1 && number <= totalPages) {
            setPage(number);
        }
    };

    return (
        <div className="district-daily-table-wrapper">

            <div className="district-daily-table-info">
                <span>DAILY RAINFALL RECORDS</span>

                <strong>
                    {data.length} records
                </strong>
            </div>

            <div className="district-daily-scroll">

                <table className="district-daily-table">

                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Rainfall</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentData.map((item, index) => {

                            const rainfall = Number(
                                item.rainfall_mm ??
                                item.rain_mm ??
                                item.rainfall ??
                                0
                            );

                            return (
                                <tr
                                    key={`${item.date}-${index}`}
                                >
                                    <td>
                                        {start + index + 1}
                                    </td>

                                    <td>
                                        {item.date || "-"}
                                    </td>

                                    <td>
                                        <strong>
                                            {rainfall.toFixed(1)}
                                        </strong>{" "}
                                        mm
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                </table>

            </div>

            <div className="district-daily-pagination">

                <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                >
                    Previous
                </button>

                <div className="district-page-numbers">

                    {Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                    ).map((number) => (
                        <button
                            key={number}
                            className={
                                page === number
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                goToPage(number)
                            }
                        >
                            {number}
                        </button>
                    ))}

                </div>

                <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                >
                    Next
                </button>

            </div>

            <div className="district-page-info">
                Page {page} of {totalPages}
                {" • "}
                Showing {start + 1}-
                {Math.min(
                    start + ROWS_PER_PAGE,
                    data.length
                )}{" "}
                of {data.length} records
            </div>

        </div>
    );
}

export default DistrictDailyTable;