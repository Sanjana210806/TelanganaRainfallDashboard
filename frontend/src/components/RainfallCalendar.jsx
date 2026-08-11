import { useEffect, useMemo, useState } from "react";

import "../styles/calendar.css";

import {
    getRainfallCalendar
} from "../services/dashboardService";


const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];


function getDaysInMonth(year, month) {

    return new Date(
        year,
        month + 1,
        0
    ).getDate();

}


function getFirstDay(year, month) {

    return new Date(
        year,
        month,
        1
    ).getDay();

}


function getRainfallClass(value) {

    if (value === 0) {

        return "rain-none";

    }


    if (value < 50) {

        return "rain-low";

    }


    if (value < 150) {

        return "rain-medium";

    }


    if (value < 300) {

        return "rain-high";

    }


    return "rain-extreme";

}


function formatRainfall(value) {

    return `${Number(
        value || 0
    ).toFixed(1)} mm`;

}


export default function RainfallCalendar({

    selectedDate,

    onDateSelect,

}) {

    const [calendarData, setCalendarData] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /* ========================================================
       LOAD 2022 CALENDAR DATA
    ======================================================== */

    useEffect(() => {

        const loadCalendar = async () => {

            try {

                setLoading(true);

                setError("");


                const data =
                    await getRainfallCalendar();


                setCalendarData(
                    data.calendar || []
                );


            } catch (err) {

                console.error(
                    "Calendar API error:",
                    err
                );


                setError(
                    "Unable to load 2022 rainfall calendar."
                );


            } finally {

                setLoading(false);

            }

        };


        loadCalendar();

    }, []);


    /* ========================================================
       CREATE DATE → DATA MAP
    ======================================================== */

    const rainfallMap = useMemo(() => {

        const map = {};


        calendarData.forEach((item) => {

            map[item.date] = item;

        });


        return map;

    }, [calendarData]);


    /* ========================================================
       LOADING
    ======================================================== */

    if (loading) {

        return (

            <div className="calendar-loading">

                Loading 2022 rainfall...

            </div>

        );

    }


    /* ========================================================
       ERROR
    ======================================================== */

    if (error) {

        return (

            <div className="calendar-error">

                {error}

            </div>

        );

    }


    /* ========================================================
       CALENDAR
    ======================================================== */

    return (

        <div className="rainfall-calendar">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="calendar-top">

                <div>

                    <span className="calendar-label">

                        DAILY RAINFALL

                    </span>


                    <h3>

                        2022 Rainfall Calendar

                    </h3>

                </div>


                {/* ==================================================
                    LEGEND
                ================================================== */}

                <div className="calendar-legend">

                    <span>

                        <i className="legend-none"></i>

                        0

                    </span>


                    <span>

                        <i className="legend-low"></i>

                        Low

                    </span>


                    <span>

                        <i className="legend-medium"></i>

                        Medium

                    </span>


                    <span>

                        <i className="legend-high"></i>

                        High

                    </span>


                    <span>

                        <i className="legend-extreme"></i>

                        Extreme

                    </span>

                </div>

            </div>


            {/* ==================================================
                MONTH GRID
            ================================================== */}

            <div className="months-grid">

                {MONTHS.map(
                    (
                        monthName,
                        monthIndex
                    ) => {

                        const daysInMonth =
                            getDaysInMonth(
                                2022,
                                monthIndex
                            );


                        const firstDay =
                            getFirstDay(
                                2022,
                                monthIndex
                            );


                        const cells = [];


                        /* ==========================================
                           EMPTY CELLS
                        ========================================== */

                        for (
                            let i = 0;
                            i < firstDay;
                            i++
                        ) {

                            cells.push(

                                <div
                                    key={`empty-${monthIndex}-${i}`}
                                    className="calendar-empty"
                                />

                            );

                        }


                        /* ==========================================
                           DAYS
                        ========================================== */

                        for (
                            let day = 1;
                            day <= daysInMonth;
                            day++
                        ) {

                            const date =
                                `2022-${String(
                                    monthIndex + 1
                                ).padStart(2, "0")}-${String(
                                    day
                                ).padStart(2, "0")}`;


                            const data =
                                rainfallMap[date];


                            const rainfall =
                                data?.total_rainfall || 0;


                            const isSelected =
                                selectedDate === date;


                            cells.push(

                                <button

                                    key={date}

                                    type="button"

                                    className={`
                                        calendar-day
                                        ${getRainfallClass(
                                            rainfall
                                        )}
                                        ${
                                            isSelected
                                                ? "selected"
                                                : ""
                                        }
                                    `}

                                    onClick={() =>
                                        onDateSelect(date)
                                    }

                                    title={`${date} • ${formatRainfall(
                                        rainfall
                                    )}`}

                                >

                                    {day}

                                </button>

                            );

                        }


                        return (

                            <div
                                className="month-card"
                                key={monthName}
                            >

                                <div className="month-title">

                                    {monthName}

                                </div>


                                <div className="week-header">

                                    <span>S</span>
                                    <span>M</span>
                                    <span>T</span>
                                    <span>W</span>
                                    <span>T</span>
                                    <span>F</span>
                                    <span>S</span>

                                </div>


                                <div className="month-days">

                                    {cells}

                                </div>

                            </div>

                        );

                    }
                )}

            </div>


            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="calendar-footer">

                <span>

                    Click any date to view detailed
                    mandal-level rainfall.

                </span>


                <span>

                    {calendarData.length} days available

                </span>

            </div>

        </div>

    );

}