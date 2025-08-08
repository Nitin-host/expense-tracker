import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import Home from './pages/Home';
import Solution from './pages/Solution';
import ExpenseManager from './pages/ExpenseManager';
import CollectedCashManager from './pages/CollectedCashManager';
import { ThemeProvider } from './utils/ThemeContext';
import CreateUserBySuperAdmin from './pages/CreateUserBySuperAdmin';
import ChangePassword from './pages/ChangePassword';
import ForgotPasswordFlow from './pages/ForgotPasswordFlow';

const App = () => {
    return (
        <Router>
            <ThemeProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path='/change-password' element={<ChangePassword />} />
                    <Route path='/forgot-password' element={<ForgotPasswordFlow />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/home" element={<Home />} />
                            <Route path="/solution" element={<Solution />} />
                            <Route path='/create-user' element={<CreateUserBySuperAdmin />} />
                            <Route path="/solution/:id/dashboard" element={<Dashboard />} />
                            <Route path="/solution/:id/collected-cash" element={<CollectedCashManager />} />
                            <Route path="/solution/:id/expense-data" element={<ExpenseManager />} />
                        </Route>
                    </Route>

                    {/* Fallback - redirect unknown paths to login */}
                    <Route path="*" element={<LoginPage />} />
                </Routes>
            </ThemeProvider>
        </Router>
    );
};

export default App;
