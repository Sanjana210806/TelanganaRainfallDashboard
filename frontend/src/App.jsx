import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import DistrictAnalysis from "./pages/DistrictAnalysis";
import MandalAnalysis from "./pages/MandalAnalysis";
import RainfallTrends from "./pages/RainfallTrends";
import HumidityAnalysis from "./pages/HumidityAnalysis";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>

        <Routes>

          {/* Main Dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* District Analysis */}
          <Route
            path="/district-analysis"
            element={<DistrictAnalysis />}
          />

          {/* Mandal Analysis */}
          <Route
            path="/mandal-analysis"
            element={<MandalAnalysis />}
          />

          {/* Rainfall Trends */}
          <Route
            path="/rainfall-trends"
            element={<RainfallTrends />}
          />

          {/* Humidity Analysis */}
          <Route
            path="/humidity-analysis"
            element={<HumidityAnalysis />}
          />

        </Routes>

      </MainLayout>
    </BrowserRouter>
  );
}

export default App;