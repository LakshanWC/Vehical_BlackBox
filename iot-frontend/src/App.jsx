import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import Accidents from './pages/Accidents';
import SpeedViolations from './pages/SpeedViolations';
import TripsTimeline  from "./components/TripsTimeline";

const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<Overview />} />
                    <Route path="overview" element={<Overview />} />
                    <Route path="trips" element={<TripsTimeline />} />
                    <Route path="accidents" element={<Accidents />} />
                    <Route path="speed" element={<SpeedViolations />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;