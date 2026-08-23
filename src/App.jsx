import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AlertProvider from './components/AlertProvider';
import AppErrorBoundary from './components/AppErrorBoundary';
import { ThemeProvider } from './utils/ThemeContext';
import InstallPwaPrompt from './components/InstallPwaPrompt';
import { lazyWithRetry } from './utils/lazyWithRetry';

const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('./pages/RegisterPage'));
const ChangePassword = lazyWithRetry(() => import('./pages/ChangePassword'));
const ForgotPasswordFlow = lazyWithRetry(() => import('./pages/ForgotPasswordFlow'));
const Home = lazyWithRetry(() => import('./pages/Home'));
const Solution = lazyWithRetry(() => import('./pages/Solution'));
const CreateUserBySuperAdmin = lazyWithRetry(() => import('./pages/CreateUserBySuperAdmin'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const CollectedCashManager = lazyWithRetry(() => import('./pages/CollectedCashManager'));
const ExpenseManager = lazyWithRetry(() => import('./pages/ExpenseManager'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));

function AuthRouteFallback() {
    return (
        <div className="auth-route-fallback" aria-busy="true" aria-label="Loading">
            <span className="sk-pulse auth-route-fallback__spinner" />
        </div>
    );
}

function LazyRoute({ children }) {
    return (
        <AppErrorBoundary>
            <Suspense fallback={<AuthRouteFallback />}>{children}</Suspense>
        </AppErrorBoundary>
    );
}

const App = () => {
    return (
        <Router>
            <ThemeProvider>
                <AlertProvider>
                    <AppErrorBoundary>
                        <Routes>
                            <Route
                                path="/login"
                                element={
                                    <LazyRoute>
                                        <LoginPage />
                                    </LazyRoute>
                                }
                            />
                            <Route
                                path="/register"
                                element={
                                    <LazyRoute>
                                        <RegisterPage />
                                    </LazyRoute>
                                }
                            />
                            <Route
                                path="/change-password"
                                element={
                                    <LazyRoute>
                                        <ChangePassword />
                                    </LazyRoute>
                                }
                            />
                            <Route
                                path="/forgot-password"
                                element={
                                    <LazyRoute>
                                        <ForgotPasswordFlow />
                                    </LazyRoute>
                                }
                            />

                            <Route element={<ProtectedRoute />}>
                                <Route element={<Layout />}>
                                    <Route
                                        path="/home"
                                        element={
                                            <LazyRoute>
                                                <Home />
                                            </LazyRoute>
                                        }
                                    />
                                    <Route
                                        path="/solution"
                                        element={
                                            <LazyRoute>
                                                <Solution />
                                            </LazyRoute>
                                        }
                                    />
                                    <Route
                                        path="/create-user"
                                        element={
                                            <LazyRoute>
                                                <CreateUserBySuperAdmin />
                                            </LazyRoute>
                                        }
                                    />
                                    <Route
                                        path="/solution/:id/dashboard"
                                        element={
                                            <LazyRoute>
                                                <Dashboard />
                                            </LazyRoute>
                                        }
                                    />
                                    <Route
                                        path="/solution/:id/collected-cash"
                                        element={
                                            <LazyRoute>
                                                <CollectedCashManager />
                                            </LazyRoute>
                                        }
                                    />
                                    <Route
                                        path="/solution/:id/expense-data"
                                        element={
                                            <LazyRoute>
                                                <ExpenseManager />
                                            </LazyRoute>
                                        }
                                    />
                                    <Route
                                        path="/solution/:id/reports"
                                        element={
                                            <LazyRoute>
                                                <Reports />
                                            </LazyRoute>
                                        }
                                    />
                                </Route>
                            </Route>

                            <Route
                                path="*"
                                element={
                                    <LazyRoute>
                                        <LoginPage />
                                    </LazyRoute>
                                }
                            />
                        </Routes>
                        <InstallPwaPrompt />
                    </AppErrorBoundary>
                </AlertProvider>
            </ThemeProvider>
        </Router>
    );
};

export default App;
