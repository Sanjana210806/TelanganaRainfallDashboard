import {
    LayoutDashboard,
    Map,
    BarChart3,
    CloudRain,
    Droplets,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import "../styles/sidebar.css";

function Sidebar() {
    return (
        <aside className="sidebar">

            {/* BRAND */}

            <div className="sidebar-brand">

                <div className="brand-mark">
                    R
                </div>

                <div className="brand-text">

                    <h2>
                        Telangana
                    </h2>

                    <span>
                        Rainfall Analytics
                    </span>

                </div>

            </div>


            {/* NAVIGATION */}

            <nav className="sidebar-nav">

                {/* DASHBOARD */}

                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <LayoutDashboard size={19} />

                    <span>
                        Dashboard
                    </span>
                </NavLink>


                {/* DISTRICT ANALYSIS */}

                <NavLink
                    to="/district-analysis"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <Map size={19} />

                    <span>
                        District Analysis
                    </span>
                </NavLink>


                {/* MANDAL ANALYSIS */}

                <NavLink
                    to="/mandal-analysis"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <BarChart3 size={19} />

                    <span>
                        Mandal Analysis
                    </span>
                </NavLink>


                {/* RAINFALL TRENDS */}

                <NavLink
                    to="/rainfall-trends"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <CloudRain size={19} />

                    <span>
                        Rainfall Trends
                    </span>
                </NavLink>


                {/* HUMIDITY ANALYSIS */}

                <NavLink
                    to="/humidity-analysis"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <Droplets size={19} />

                    <span>
                        Humidity Analysis
                    </span>
                </NavLink>

            </nav>


            {/* SIDEBAR FOOTER */}

            <div className="sidebar-footer">

                <div>

                    <span>
                        DATA YEAR
                    </span>

                    <strong>
                        2022
                    </strong>

                </div>

            </div>

        </aside>
    );
}

export default Sidebar;