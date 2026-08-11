import React, { useEffect, useMemo, useState } from "react";
import rainfallBackground from "../image/rainfall-dashboard-bg.png";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "../styles/humidity-analysis.css";

const API = "/api/rainfall/humidity/analysis/";

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const COLORS = [
  "#9BCBE8",
  "#76B2D7",
  "#4B91C5",
  "#3479AE",
  "#285F89"
];

const get = (obj, keys, fallback = null) => {
  if (!obj) return fallback;

  for (const key of keys) {
    if (
      obj[key] !== undefined &&
      obj[key] !== null &&
      obj[key] !== ""
    ) {
      return obj[key];
    }
  }

  return fallback;
};

const number = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    return Object.entries(value).map(([name, value]) => ({
      name,
      value
    }));
  }

  return [];
};

function HumidityAnalysis() {

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  /* =========================
     LOAD API DATA
  ========================= */

  useEffect(() => {
    fetch(API)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error("Humidity Analysis:", err);
        setError("Unable to load humidity analysis.");
      });
  }, []);

  /* =========================
     KPI DATA
  ========================= */

  const stats = useMemo(() => {
    if (!data) return {};

    const source =
      data.summary ||
      data.statistics ||
      data;

    return {
      average: number(
        get(source, [
          "average_humidity",
          "avg_humidity",
          "mean_humidity",
          "average"
        ])
      ),

      maximum: number(
        get(source, [
          "maximum_humidity",
          "max_humidity",
          "maximum",
          "max"
        ])
      ),

      minimum: number(
        get(source, [
          "minimum_humidity",
          "min_humidity",
          "minimum",
          "min"
        ])
      ),

      peakMonth:
        get(source, [
          "peak_humidity_month",
          "peak_month",
          "highest_humidity_month"
        ]) || "—"
    };
  }, [data]);

  /* =========================
     MONTHLY DATA
  ========================= */

  const monthlyData = useMemo(() => {
    const raw = get(
      data,
      [
        "monthly",
        "monthly_humidity",
        "monthly_trend",
        "monthly_data"
      ],
      []
    );

    return normalizeArray(raw)
      .slice(0, 12)
      .map((item, index) => ({
        month:
          get(item, [
            "month",
            "name",
            "label"
          ]) || months[index],

        humidity: number(
          get(item, [
            "humidity",
            "average_humidity",
            "avg_humidity",
            "mean_humidity",
            "value"
          ])
        ),

        rainfall: number(
          get(item, [
            "rainfall",
            "rainfall_mm",
            "rain_mm",
            "total_rainfall",
            "total_rainfall_mm",
            "monthly_rainfall",
            "monthly_rainfall_mm"
          ])
        )
      }));
  }, [data]);

  /* =========================
     DISTRIBUTION
  ========================= */

  const distributionData = useMemo(() => {
    const raw = get(
      data,
      [
        "distribution",
        "humidity_distribution",
        "humidity_levels"
      ],
      []
    );

    return normalizeArray(raw).map((item) => ({
      name:
        get(item, [
          "name",
          "label",
          "category",
          "level"
        ]) || "Unknown",

      value: number(
        get(item, [
          "value",
          "count",
          "observations",
          "total"
        ])
      )
    }));
  }, [data]);

  /* =========================
     TOP 10 DISTRICTS
  ========================= */

  const districtData = useMemo(() => {
    const raw = get(
      data,
      [
        "districts",
        "district_comparison",
        "district_humidity",
        "districts_data"
      ],
      []
    );

    return normalizeArray(raw)
      .map((item) => ({
        district:
          get(item, [
            "district",
            "district_name",
            "name"
          ]) || "Unknown",

        humidity: number(
          get(item, [
            "humidity",
            "average_humidity",
            "avg_humidity",
            "mean_humidity",
            "value"
          ])
        )
      }))
      .filter(
        (item) => item.district !== "Unknown"
      )
      .sort(
        (a, b) => b.humidity - a.humidity
      )
      .slice(0, 10);
  }, [data]);

  /* =========================
     HEATMAP
  ========================= */

  const heatmapData = useMemo(() => {
    return normalizeArray(
      get(
        data,
        [
          "heatmap",
          "district_month",
          "district_monthly",
          "monthly_district"
        ],
        []
      )
    );
  }, [data]);

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <div className="humidity-page">

        <div
          className="humidity-background"
          style={{
            backgroundImage:
              `url(${rainfallBackground})`
          }}
        />

        <div className="humidity-error">
          {error}
        </div>

      </div>
    );
  }

  /* =========================
     LOADING
  ========================= */

  if (!data) {
    return (
      <div className="humidity-page">

        <div
          className="humidity-background"
          style={{
            backgroundImage:
              `url(${rainfallBackground})`
          }}
        />

        <div className="humidity-loading">
          Loading humidity analysis...
        </div>

      </div>
    );
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <div className="humidity-page">

      {/* BACKGROUND */}

      <div
        className="humidity-background"
        style={{
          backgroundImage:
            `url(${rainfallBackground})`
        }}
      />

      <main className="humidity-content">

        {/* =========================
            HERO
        ========================= */}

        <section className="humidity-hero">

          <div className="humidity-hero-overlay" />

          <div className="humidity-hero-content">

            <span className="humidity-eyebrow">
              TELANGANA HUMIDITY ANALYTICS
            </span>

            <h1>
              Telangana Humidity Analysis
            </h1>

            <p>
              Explore humidity patterns and
              atmospheric conditions across
              Telangana during 2022.
            </p>

          </div>

          <div className="humidity-year">
            2022
          </div>

        </section>

        {/* =========================
            KPI CARDS
        ========================= */}

        <section className="humidity-kpis">

          <div className="humidity-kpi">
            <span>Average Humidity</span>
            <strong>{stats.average}%</strong>
            <small>Annual average</small>
          </div>

          <div className="humidity-kpi">
            <span>Maximum Humidity</span>
            <strong>{stats.maximum}%</strong>
            <small>Highest recorded</small>
          </div>

          <div className="humidity-kpi">
            <span>Minimum Humidity</span>
            <strong>{stats.minimum}%</strong>
            <small>Lowest recorded</small>
          </div>

          <div className="humidity-kpi">
            <span>Peak Humidity Month</span>
            <strong>{stats.peakMonth}</strong>
            <small>Highest monthly level</small>
          </div>

        </section>

        {/* =========================
            MONTHLY + DISTRIBUTION
        ========================= */}

        <section className="humidity-grid">

          {/* MONTHLY */}

          <div className="humidity-card large">

            <div className="card-heading">
              <span>MONTHLY PATTERN</span>
              <h2>Monthly Humidity Trend</h2>
            </div>

            <div className="chart-box">

              {monthlyData.length ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart data={monthlyData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis dataKey="month" />

                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Humidity"
                      ]}
                    />

                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3479AE"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#3479AE"
                      }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (
                <Empty />
              )}

            </div>

          </div>

          {/* DISTRIBUTION */}

          <div className="humidity-card small">

            <div className="card-heading">
              <span>HUMIDITY DISTRIBUTION</span>
              <h2>Humidity Levels</h2>
            </div>

            <div className="donut-box">

              {distributionData.length ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={2}
                    >

                      {distributionData.map(
                        (_, index) => (
                          <Cell
                            key={index}
                            fill={
                              COLORS[
                                index %
                                COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) => [
                        Number(value).toLocaleString(),
                        "Observations"
                      ]}
                    />

                  </PieChart>

                </ResponsiveContainer>

              ) : (
                <Empty />
              )}

            </div>

            <div className="legend-list">

              {distributionData.map(
                (item, index) => (

                  <div
                    className="legend-item"
                    key={item.name}
                  >

                    <span
                      className="legend-dot"
                      style={{
                        background:
                          COLORS[
                            index %
                            COLORS.length
                          ]
                      }}
                    />

                    <span>
                      {item.name}
                    </span>

                    <strong>
                      {Number(
                        item.value
                      ).toLocaleString()}
                    </strong>

                  </div>

                )
              )}

            </div>

          </div>

        </section>

        {/* =========================
            50 : 50 SECTION
        ========================= */}

        <section className="humidity-grid humidity-two-column">

          {/* HUMIDITY VS RAINFALL */}

          <div className="humidity-card">

            <div className="card-heading">
              <span>
                MONTHLY CLIMATE RELATIONSHIP
              </span>

              <h2>
                Humidity vs Rainfall
              </h2>
            </div>

            <div className="humidity-rainfall-chart">

              {monthlyData.length ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <ComposedChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 15,
                      left: 5,
                      bottom: 5
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      interval={0}
                      tick={{
                        fill: "#6686A0",
                        fontSize: 11
                      }}
                      tickMargin={8}
                    />

                    <YAxis
                      yAxisId="rainfall"
                      orientation="left"
                      tick={{
                        fontSize: 10,
                        fill: "#4B91C5"
                      }}
                      tickFormatter={(v) =>
                        Number(v).toLocaleString()
                      }
                      label={{
                        value: "Rainfall (mm)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#4B91C5",
                        fontSize: 12
                      }}
                    />

                    <YAxis
                      yAxisId="humidity"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{
                        fontSize: 10,
                        fill: "#285F89"
                      }}
                      tickFormatter={(v) =>
                        `${v}%`
                      }
                      label={{
                        value: "Humidity (%)",
                        angle: 90,
                        position: "insideRight",
                        fill: "#285F89",
                        fontSize: 12
                      }}
                    />

                    <Tooltip
                      formatter={(value, name) =>
                        name === "Rainfall"
                          ? [
                              `${Number(
                                value
                              ).toLocaleString(
                                undefined,
                                {
                                  maximumFractionDigits: 1
                                }
                              )} mm`,
                              name
                            ]
                          : [
                              `${Number(
                                value
                              ).toFixed(1)}%`,
                              name
                            ]
                      }
                    />

                    <Legend />

                    <Bar
                      yAxisId="rainfall"
                      dataKey="rainfall"
                      name="Rainfall"
                      fill="#4B91C5"
                      radius={[
                        5,
                        5,
                        0,
                        0
                      ]}
                      barSize={18}
                      isAnimationActive={false}
                    />

                    <Line
                      yAxisId="humidity"
                      type="monotone"
                      dataKey="humidity"
                      name="Average Humidity"
                      stroke="#285F89"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#285F89",
                        stroke: "#fff",
                        strokeWidth: 2
                      }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={false}
                    />

                  </ComposedChart>

                </ResponsiveContainer>

              ) : (
                <Empty />
              )}

            </div>

          </div>

          {/* TOP 10 DISTRICTS */}

          <div className="humidity-card">

            <div className="card-heading">

              <span>
                DISTRICT COMPARISON
              </span>

              <h2>
                Top 10 District Humidity
              </h2>

            </div>

            <div className="humidity-district-chart">

              {districtData.length ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={districtData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 20,
                      left: 15,
                      bottom: 5
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      ticks={[
                        0,
                        25,
                        50,
                        75,
                        100
                      ]}
                      tickFormatter={(v) =>
                        `${v}%`
                      }
                      tick={{
                        fontSize: 10
                      }}
                    />

                    <YAxis
                      type="category"
                      dataKey="district"
                      width={125}
                      interval={0}
                      tick={{
                        fontSize: 11,
                        fill: "#55758F"
                      }}
                      tickLine={false}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(
                          value
                        ).toFixed(1)}%`,
                        "Humidity"
                      ]}
                    />

                    <Bar
                      dataKey="humidity"
                      name="Humidity"
                      fill="#4389BD"
                      radius={[
                        0,
                        6,
                        6,
                        0
                      ]}
                      barSize={22}
                      isAnimationActive={false}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (
                <Empty />
              )}

            </div>

          </div>

        </section>

        {/* =========================
            HEATMAP
        ========================= */}

        <section className="humidity-card heatmap-card">

          <div className="card-heading">
            <span>DISTRICT × MONTH</span>
            <h2>Humidity Heatmap</h2>
          </div>

          {heatmapData.length ? (
            <HumidityHeatmap data={heatmapData} />
          ) : (
            <Empty />
          )}

        </section>

      </main>

    </div>
  );
}


/* =========================
   HEATMAP
========================= */

function HumidityHeatmap({ data }) {

  return (
    <div className="heatmap-scroll">

      <div className="heatmap">

        <div className="heatmap-row heatmap-header">

          <div className="district-name">
            District
          </div>

          {months.map((month) => (
            <div key={month}>
              {month}
            </div>
          ))}

        </div>

        {data.slice(0, 33).map(
          (row, index) => {

            const district =
              get(row, [
                "district",
                "district_name",
                "name"
              ]) ||
              `District ${index + 1}`;

            return (
              <div
                className="heatmap-row"
                key={district}
              >

                <div className="district-name">
                  {district}
                </div>

                {months.map(
                  (month, monthIndex) => {

                    const value = get(
                      row,
                      [
                        month,
                        month.toLowerCase(),
                        `month_${monthIndex + 1}`
                      ]
                    );

                    const humidity =
                      number(value);

                    return (
                      <div
                        key={month}
                        className="heat-cell"
                        style={{
                          background:
                            `rgba(
                              52,
                              121,
                              174,
                              ${Math.max(
                                0.12,
                                humidity / 100
                              )}
                            )`
                        }}
                        title={
                          `${district} • ` +
                          `${month}: ` +
                          `${humidity}%`
                        }
                      >
                        {humidity
                          ? humidity.toFixed(0)
                          : "—"}
                      </div>
                    );

                  }
                )}

              </div>
            );
          }
        )}

      </div>
    </div>
  );
}


/* =========================
   EMPTY
========================= */

function Empty() {
  return (
    <div className="empty-chart">
      No data available
    </div>
  );
}

export default HumidityAnalysis;