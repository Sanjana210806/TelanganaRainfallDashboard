import React, { useEffect, useState } from "react";
import "../styles/rainfall-trends.css";
import rainfallBackground from "../image/rainfall-dashboard-bg.png";

const API_URL = "/api/rainfall/trends/";

export default function RainfallTrends() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || "Unable to load rainfall trends");
            }

            setData(result);
        } catch (err) {
            console.error("Rainfall trends:", err);
            setError(err.message || "Unable to load rainfall trends");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const Background = () => (
        <div
            className="rainfall-trends-background"
            style={{ backgroundImage: `url(${rainfallBackground})` }}
        />
    );

    if (loading) {
        return (
            <div className="rainfall-trends-page">
                <Background />
                <div className="trends-loading">
                    <div className="loading-spinner" />
                    <p>Loading rainfall trends...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rainfall-trends-page">
                <Background />
                <div className="trends-error">
                    <h2>Unable to load rainfall trends</h2>
                    <p>{error}</p>
                    <button onClick={loadData}>Try Again</button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const {
        summary = {},
        intensity_distribution: intensity = {},
        anomaly = [],
        daily_rainfall: daily = [],
        top_20_days: topDays = [],
        top_5_districts: topDistricts = [],
        top_20_mandals: topMandals = [],
        quarterly_contribution: quarters = []
    } = data;

    return (
        <div className="rainfall-trends-page">
            <Background />

            <main className="rainfall-trends-content">

                {/* HERO */}
                <section
                    className="rainfall-overview-header"
                    style={{ backgroundImage: `url(${rainfallBackground})` }}
                >
                    <div className="rainfall-header-overlay" />

                    <div className="rainfall-header-content">
                        <span className="rainfall-eyebrow">
                            TELANGANA RAINFALL ANALYTICS
                        </span>

                        <h1>Rainfall Overview</h1>

                        <p>
                            Explore rainfall, humidity and mandal-level
                            patterns across Telangana during 2022.
                        </p>
                    </div>

                    <div className="rainfall-year-badge">2022</div>
                </section>

                {/* KPIs */}
                <section className="trends-kpi-grid">
                    <KpiCard label="Rainy Days" value={summary.rainy_days} suffix="days" />
                    <KpiCard label="Rain-Free Days" value={summary.rain_free_days} suffix="days" />
                    <KpiCard label="Total Rainfall" value={formatNumber(summary.total_rainfall)} suffix="mm" />
                    <KpiCard label="Average Rainfall" value={formatNumber(summary.average_daily_rainfall)} suffix="mm/day" />
                    <KpiCard label="Highest Rainfall" value={formatNumber(summary.highest_daily_rainfall)} suffix="mm" />
                </section>

                {/* DAILY + INTENSITY */}
                <section className="trends-two-column">
                    <div className="trend-card">
                        <SectionTitle eyebrow="DAILY TREND" title="Daily Rainfall Trend" />
                        <RainfallLineChart data={daily} />
                    </div>

                    <div className="trend-card">
                        <SectionTitle eyebrow="RAINFALL DISTRIBUTION" title="Rainfall Intensity" />
                        <IntensityPie data={intensity} />
                    </div>
                </section>

                {/* ANOMALY + QUARTERLY */}
                <section className="trends-two-column">
                    <div className="trend-card">
                        <SectionTitle
                            eyebrow="RAINFALL VARIABILITY"
                            title="Rainfall Anomaly"
                            subtitle="Deviation from 2022 daily average"
                        />
                        <AnomalyChart data={anomaly} />
                    </div>

                    <div className="trend-card">
                        <SectionTitle
                            eyebrow="SEASONAL DISTRIBUTION"
                            title="Quarterly Rainfall"
                        />
                        <QuarterPie data={quarters} />
                    </div>
                </section>

                {/* TOP DAYS + DISTRICTS */}
                <section className="trends-two-column">
                    <div className="trend-card">
                        <SectionTitle
                            eyebrow="EXTREME EVENTS"
                            title="Top 20 Highest Rainfall Days"
                        />

                        <div className="table-wrapper">
                            <table className="trends-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Date</th>
                                        <th>Rainfall</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {topDays.map((item, index) => (
                                        <tr key={item.rank || index}>
                                            <td>
                                                <span className="rank-number">
                                                    {item.rank || index + 1}
                                                </span>
                                            </td>

                                            <td>{formatDate(item.date)}</td>

                                            <td>
                                                <strong>
                                                    {formatNumber(item.rainfall_mm)}
                                                </strong>{" "}
                                                mm
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="trend-card">
                        <SectionTitle
                            eyebrow="DISTRICT PERFORMANCE"
                            title="Top 5 Highest Rainfall Districts"
                        />

                        <div className="district-ranking">
                            {topDistricts.map((item, index) => {
                                const rainfall = Number(item.rainfall_mm || 0);
                                const max = Number(topDistricts[0]?.rainfall_mm || 1);
                                const width = Math.min((rainfall / max) * 100, 100);

                                return (
                                    <div
                                        className="district-rank-item"
                                        key={item.rank || index}
                                    >
                                        <div className="district-rank-top">
                                            <div className="district-name">
                                                <span className="rank-circle">
                                                    {item.rank || index + 1}
                                                </span>
                                                <span>{item.district}</span>
                                            </div>

                                            <strong>
                                                {formatNumber(rainfall)} mm
                                            </strong>
                                        </div>

                                        <div className="ranking-bar">
                                            <span style={{ width: `${width}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* MANDALS */}
                <section className="trend-card top-mandals-card">
                    <SectionTitle
                        eyebrow="MANDAL PERFORMANCE"
                        title="Top 20 Highest Rainfall Mandals"
                    />

                    <div className="mandal-table-wrapper">
                        <table className="trends-table mandal-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Mandal</th>
                                    <th>District</th>
                                    <th>Rainfall</th>
                                </tr>
                            </thead>

                            <tbody>
                                {topMandals.map((item, index) => (
                                    <tr
                                        key={`${item.district}-${item.mandal}-${index}`}
                                    >
                                        <td>
                                            <span className="rank-number">
                                                {item.rank || index + 1}
                                            </span>
                                        </td>

                                        <td>
                                            <strong>{item.mandal}</strong>
                                        </td>

                                        <td>{item.district}</td>

                                        <td>
                                            <strong>
                                                {formatNumber(item.rainfall_mm)}
                                            </strong>{" "}
                                            mm
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </main>
        </div>
    );
}

/* KPI */
function KpiCard({ label, value, suffix }) {
    return (
        <div className="trend-kpi">
            <span>{label}</span>
            <div className="kpi-value">
                {value}
                <small>{suffix}</small>
            </div>
        </div>
    );
}

/* TITLE */
function SectionTitle({ eyebrow, title, subtitle }) {
    return (
        <div className="trend-section-title">
            <span>{eyebrow}</span>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
        </div>
    );
}

/* LINE CHART */
function RainfallLineChart({ data }) {
    const [hovered, setHovered] = useState(null);

    if (!data.length) {
        return <div className="chart-empty">No rainfall data available</div>;
    }

    const width = 900;
    const height = 310;
    const pl = 55;
    const pr = 25;
    const pt = 25;
    const pb = 45;
    const cw = width - pl - pr;
    const ch = height - pt - pb;

    const max = Math.max(
        ...data.map(x => Number(x.rainfall_mm || 0)),
        1
    );

    const points = data.map((item, i) => ({
        x: pl + (i / Math.max(data.length - 1, 1)) * cw,
        y:
            pt +
            ch -
            (Number(item.rainfall_mm || 0) / max) * ch,
        value: Number(item.rainfall_mm || 0),
        date: item.date
    }));

    const line = points.map(p => `${p.x},${p.y}`).join(" ");
    const area = [
        `${pl},${pt + ch}`,
        ...points.map(p => `${p.x},${p.y}`),
        `${pl + cw},${pt + ch}`
    ].join(" ");

    const target = index => {
        const p = points[index];
        const prev = points[index - 1];
        const next = points[index + 1];

        const left = prev ? (prev.x + p.x) / 2 : pl;
        const right = next ? (p.x + next.x) / 2 : pl + cw;

        return { ...p, left, width: Math.max(right - left, 2) };
    };

    return (
        <div className="line-chart-container">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="rainfall-line-chart"
                preserveAspectRatio="none"
                onMouseLeave={() => setHovered(null)}
            >
                <defs>
                    <linearGradient
                        id="rainfallAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop offset="0%" stopColor="#4180b8" stopOpacity=".35" />
                        <stop offset="100%" stopColor="#8dbbdc" stopOpacity=".03" />
                    </linearGradient>
                </defs>

                {Array.from({ length: 6 }).map((_, i) => {
                    const y = pt + (i / 5) * ch;
                    const value = max - (i / 5) * max;

                    return (
                        <g key={i}>
                            <line
                                x1={pl}
                                x2={pl + cw}
                                y1={y}
                                y2={y}
                                className="chart-grid-line"
                            />
                            <text
                                x={pl - 8}
                                y={y + 4}
                                textAnchor="end"
                                className="chart-axis-text"
                            >
                                {Math.round(value)}
                            </text>
                        </g>
                    );
                })}

                <polygon points={area} fill="url(#rainfallAreaGradient)" />

                <polyline
                    points={line}
                    fill="none"
                    stroke="#4180b8"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {hovered && (
                    <>
                        <line
                            x1={hovered.x}
                            x2={hovered.x}
                            y1={pt}
                            y2={pt + ch}
                            className="chart-hover-line"
                        />
                        <circle
                            cx={hovered.x}
                            cy={hovered.y}
                            r="6"
                            className="chart-hover-point"
                        />
                    </>
                )}

                {points.map((point, index) => {
                    const t = target(index);

                    return (
                        <rect
                            key={index}
                            x={t.left}
                            y={pt}
                            width={t.width}
                            height={ch}
                            className="chart-hover-target"
                            onMouseEnter={() => setHovered(point)}
                        />
                    );
                })}

                {points
                    .filter(
                        (_, i) =>
                            i %
                                Math.max(
                                    Math.ceil(data.length / 8),
                                    1
                                ) === 0
                    )
                    .map((p, i) => (
                        <text
                            key={i}
                            x={p.x}
                            y={pt + ch + 27}
                            textAnchor="middle"
                            className="chart-axis-text"
                        >
                            {formatShortDate(p.date)}
                        </text>
                    ))}
            </svg>

            {hovered && (
                <div
                    className="rainfall-chart-tooltip"
                    style={{
                        left: `${Math.min(
                            Math.max((hovered.x / width) * 100, 10),
                            90
                        )}%`,
                        top: `${Math.max(
                            (hovered.y / height) * 100,
                            12
                        )}%`
                    }}
                >
                    <strong>{formatDate(hovered.date)}</strong>
                    <span>
                        Rainfall:
                        <b>{hovered.value.toFixed(1)} mm</b>
                    </span>
                </div>
            )}
        </div>
    );
}

/* INTENSITY PIE */
function IntensityPie({ data }) {
    const items = [
        ["no_rain", "No Rain"],
        ["light", "Light"],
        ["moderate", "Moderate"],
        ["heavy", "Heavy"],
        ["very_heavy", "Very Heavy"],
        ["extreme", "Extreme"]
    ].map(([key, label]) => ({
        key,
        label,
        value: Number(data[key] || 0)
    }));

    return (
        <PieChart
            items={items}
            colors={[
                "#dcecf7",
                "#9fc7e3",
                "#6da7ce",
                "#4180b8",
                "#315f85",
                "#203f5c"
            ]}
            centerLabel="Days"
        />
    );
}

/* QUARTER PIE */
function QuarterPie({ data }) {
    const items = data.map(item => ({
        key: item.quarter,
        label: item.quarter,
        value: Number(item.rainfall_mm || 0)
    }));

    return (
        <PieChart
            items={items}
            colors={[
                "#b9d8ec",
                "#76add0",
                "#4180b8",
                "#315f85"
            ]}
            centerLabel="mm"
            formatter={formatNumber}
        />
    );
}

/* REUSABLE PIE */
function PieChart({ items, colors, centerLabel, formatter = v => v }) {
    const total = items.reduce((sum, x) => sum + x.value, 0);
    let angle = 0;

    const segments = items.map((item, i) => {
        const part = total ? item.value / total : 0;
        const start = angle;
        angle += part * 360;

        return {
            ...item,
            start,
            end: angle,
            color: colors[i]
        };
    });

    const gradient = segments
        .map(x => `${x.color} ${x.start}deg ${x.end}deg`)
        .join(",");

    return (
        <div className="pie-wrapper">
            <div
                className="intensity-pie"
                style={{ background: `conic-gradient(${gradient})` }}
            >
                <div className="pie-center">
                    <strong>{formatter(total)}</strong>
                    <span>{centerLabel}</span>
                </div>
            </div>

            <div className="pie-legend">
                {segments.map(item => (
                    <div className="pie-legend-item" key={item.key}>
                        <span
                            className="legend-dot"
                            style={{ background: item.color }}
                        />
                        <span>{item.label}</span>
                        <strong>{formatter(item.value)}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ANOMALY */
function AnomalyChart({ data }) {
    if (!data.length) {
        return <div className="chart-empty">No anomaly data available</div>;
    }

    const max = Math.max(
        ...data.map(x => Math.abs(Number(x.deviation || 0))),
        10
    );

    return (
        <div className="anomaly-chart">
            <div className="anomaly-zero-line" />

            {data.map(item => {
                const value = Number(item.deviation || 0);
                const height = Math.min(
                    (Math.abs(value) / max) * 100,
                    100
                );

                return (
                    <div className="anomaly-column" key={item.month}>
                        <div
                            className={`anomaly-value ${
                                value >= 0 ? "positive" : "negative"
                            }`}
                            style={{ height: `${height}%` }}
                        >
                            <span>
                                {value > 0 ? "+" : ""}
                                {value}%
                            </span>
                        </div>
                        <small>{item.month}</small>
                    </div>
                );
            })}
        </div>
    );
}

/* HELPERS */
const formatNumber = value =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 1
    });

const formatDate = date =>
    date
        ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric"
          })
        : "-";

const formatShortDate = date =>
    date
        ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short"
          })
        : "";