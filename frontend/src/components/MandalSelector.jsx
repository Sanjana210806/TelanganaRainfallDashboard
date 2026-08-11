import { useEffect, useState } from "react";

const MANDALS_PER_PAGE = 25;

function MandalSelector({
    district,
    selectedMandal,
    onMandalSelect
}) {
    const [mandals, setMandals] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!district) {
            setMandals([]);
            setPage(1);
            return;
        }

        const loadMandals = async () => {
            try {
                setLoading(true);
                setError("");
                setPage(1);

                const response = await fetch(
                    `/api/rainfall/mandals/?district=${encodeURIComponent(district)}`
                );

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(
                        result.message || "Unable to load mandals."
                    );
                }

                const list = (
                    result.mandals ||
                    result.data ||
                    []
                )
                    .map(item =>
                        typeof item === "string"
                            ? item
                            : item.name ||
                              item.mandal ||
                              item.mandal_name
                    )
                    .filter(Boolean)
                    .sort((a, b) =>
                        a.localeCompare(b, undefined, {
                            sensitivity: "base"
                        })
                    );

                setMandals(list);
            } catch (err) {
                console.error("Mandal data error:", err);
                setError("Unable to load mandals.");
            } finally {
                setLoading(false);
            }
        };

        loadMandals();
    }, [district]);

    if (!district) {
        return (
            <div className="mandal-empty">
                Select a district first.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="mandal-data-state">
                Loading mandals...
            </div>
        );
    }

    if (error) {
        return (
            <div className="mandal-data-error">
                {error}
            </div>
        );
    }

    if (!mandals.length) {
        return (
            <div className="mandal-empty">
                No mandals available.
            </div>
        );
    }

    const totalPages = Math.ceil(
        mandals.length / MANDALS_PER_PAGE
    );

    const start = (page - 1) * MANDALS_PER_PAGE;

    const currentMandals = mandals.slice(
        start,
        start + MANDALS_PER_PAGE
    );

    const changePage = newPage => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="mandal-selector">

            <div className="mandal-list">
                {currentMandals.map((mandal, index) => (
                    <button
                        key={`${mandal}-${index}`}
                        type="button"
                        className={
                            selectedMandal === mandal
                                ? "mandal-item active"
                                : "mandal-item"
                        }
                        onClick={() =>
                            onMandalSelect(mandal)
                        }
                    >
                        <span>
                            {start + index + 1}
                        </span>

                        <strong>
                            {mandal}
                        </strong>
                    </button>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="mandal-pagination">

                    <button
                        type="button"
                        onClick={() =>
                            changePage(page - 1)
                        }
                        disabled={page === 1}
                    >
                        Previous
                    </button>

                    <div className="mandal-page-numbers">
                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map(number => (
                            <button
                                key={number}
                                type="button"
                                className={
                                    page === number
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    changePage(number)
                                }
                            >
                                {number}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            changePage(page + 1)
                        }
                        disabled={page === totalPages}
                    >
                        Next
                    </button>

                </div>
            )}

            <div className="mandal-page-info">
                Page {page} of {totalPages}
                {" • "}
                Showing {start + 1}-
                {Math.min(
                    start + MANDALS_PER_PAGE,
                    mandals.length
                )}{" "}
                of {mandals.length} mandals
            </div>

        </div>
    );
}

export default MandalSelector;