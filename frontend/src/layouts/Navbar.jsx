import {
    CalendarDays,
    Bell,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import "../styles/navbar.css";

const navRoutes = [
    { path: "/", label: "Dashboard" },
    { path: "/district-analysis", label: "District Analysis" },
    { path: "/mandal-analysis", label: "Mandal Analysis" },
    { path: "/rainfall-trends", label: "Rainfall Trends" },
    { path: "/humidity-analysis", label: "Humidity Analysis" },
];

function Navbar() {

    const location = useLocation();
    const navigate = useNavigate();

    const currentIndex = navRoutes.findIndex(route => route.path === location.pathname);
    const currentRoute = navRoutes[currentIndex] ?? navRoutes[0];
    const isDashboard = currentRoute.path === "/";
    const previousRoute = currentIndex > 0 ? navRoutes[currentIndex - 1] : null;
    const nextRoute = currentIndex >= 0 && currentIndex < navRoutes.length - 1 ? navRoutes[currentIndex + 1] : null;

    const goPrevious = () => {
        if (previousRoute) {
            navigate(previousRoute.path);
        }
    };

    const goNext = () => {
        if (nextRoute) {
            navigate(nextRoute.path);
        }
    };

    return (
        <header className="navbar">

            <div className="navbar-left">

                <div className="page-nav-buttons">
                    <button
                        className={`nav-arrow ${isDashboard ? "static" : ""}`}
                        type="button"
                        onClick={isDashboard ? undefined : goPrevious}
                        disabled={isDashboard}
                        aria-label="Previous page"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    {!isDashboard && (
                        <button
                            className={`nav-arrow ${nextRoute ? "" : "disabled"}`}
                            type="button"
                            onClick={nextRoute ? goNext : undefined}
                            disabled={!nextRoute}
                            aria-label="Next page"
                        >
                            <ArrowRight size={18} />
                        </button>
                    )}
                </div>

                <div>

                    <p className="navbar-eyebrow">
                        TELANGANA STATE
                    </p>

                    <h1>
                        Rainfall Dashboard
                    </h1>

                </div>

            </div>


            <div className="navbar-right">

                <div className="year-badge">

                    <CalendarDays size={18} />

                    <span>
                        2022
                    </span>

                </div>


                <button
                    className="icon-button"
                    type="button"
                >

                    <Bell size={19} />

                </button>

            </div>

        </header>
    );
}


export default Navbar;