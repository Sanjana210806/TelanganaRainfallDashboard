import { useRef, useState } from "react";

import "../styles/dashboard.css";

import RainfallCalendar from "../components/RainfallCalendar";
import DailyRainfallPanel from "../components/DailyRainfallPanel";


function Dashboard() {

    const [selectedDate, setSelectedDate] = useState(null);

    const dailyPanelRef = useRef(null);


    const handleDateSelect = (date) => {

        console.log("Selected date:", date);

        setSelectedDate(date);

        // Wait for React to update the panel
        setTimeout(() => {

            if (dailyPanelRef.current) {

                dailyPanelRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

            }

        }, 150);

    };


    return (

        <div className="dashboard-page">

            {/* ==================================================
                BACKGROUND
            ================================================== */}

            <div className="dashboard-background"></div>


            {/* ==================================================
                CONTENT
            ================================================== */}

            <div className="dashboard-content">


                {/* ==================================================
                    INTRO
                ================================================== */}

                <section className="dashboard-intro">

                    <div>

                        <p className="section-eyebrow">
                            TELANGANA RAINFALL ANALYTICS
                        </p>

                        <h2>
                            Rainfall Overview
                        </h2>

                        <p className="dashboard-description">
                            Explore rainfall, humidity and
                            mandal-level patterns across
                            Telangana during 2022.
                        </p>

                    </div>


                    <div className="dashboard-year">
                        2022
                    </div>

                </section>



                {/* ==================================================
                    RAINFALL CALENDAR
                ================================================== */}

                <section className="dashboard-card calendar-card">

                    <RainfallCalendar
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                    />

                </section>



                {/* ==================================================
                    DAILY RAINFALL ANALYSIS
                ================================================== */}

                <section
                    ref={dailyPanelRef}
                    className="dashboard-card daily-card"
                    id="daily-rainfall-analysis"
                >

                    <DailyRainfallPanel
                        selectedDate={selectedDate}
                    />

                </section>


            </div>

        </div>

    );

}


export default Dashboard;