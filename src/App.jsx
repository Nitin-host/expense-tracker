import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AlertProvider from './components/AlertProvider';
import { ThemeProvider } from './utils/ThemeContext';
import InstallPwaPrompt from './components/InstallPwaPrompt';



const LoginPage = lazy(() => import('./pages/LoginPage'));

const RegisterPage = lazy(() => import('./pages/RegisterPage'));

const ChangePassword = lazy(() => import('./pages/ChangePassword'));

const ForgotPasswordFlow = lazy(() => import('./pages/ForgotPasswordFlow'));

const Home = lazy(() => import('./pages/Home'));

const Solution = lazy(() => import('./pages/Solution'));

const CreateUserBySuperAdmin = lazy(() => import('./pages/CreateUserBySuperAdmin'));

const Dashboard = lazy(() => import('./pages/Dashboard'));

const CollectedCashManager = lazy(() => import('./pages/CollectedCashManager'));

const ExpenseManager = lazy(() => import('./pages/ExpenseManager'));

const Reports = lazy(() => import('./pages/Reports'));



function AuthRouteFallback() {

    return (

        <div className="auth-route-fallback" aria-busy="true" aria-label="Loading">

            <span className="sk-pulse auth-route-fallback__spinner" />

        </div>

    );

}



const App = () => {

    return (
        <Router>
            <ThemeProvider>
                <AlertProvider>
                    <Routes>

                    <Route

                        path="/login"

                        element={

                            <Suspense fallback={<AuthRouteFallback />}>

                                <LoginPage />

                            </Suspense>

                        }

                    />

                    <Route

                        path="/register"

                        element={

                            <Suspense fallback={<AuthRouteFallback />}>

                                <RegisterPage />

                            </Suspense>

                        }

                    />

                    <Route

                        path="/change-password"

                        element={

                            <Suspense fallback={<AuthRouteFallback />}>

                                <ChangePassword />

                            </Suspense>

                        }

                    />

                    <Route

                        path="/forgot-password"

                        element={

                            <Suspense fallback={<AuthRouteFallback />}>

                                <ForgotPasswordFlow />

                            </Suspense>

                        }

                    />



                    <Route element={<ProtectedRoute />}>

                        <Route element={<Layout />}>

                            <Route path="/home" element={<Home />} />

                            <Route path="/solution" element={<Solution />} />

                            <Route path="/create-user" element={<CreateUserBySuperAdmin />} />

                            <Route path="/solution/:id/dashboard" element={<Dashboard />} />

                            <Route path="/solution/:id/collected-cash" element={<CollectedCashManager />} />

                            <Route path="/solution/:id/expense-data" element={<ExpenseManager />} />

                            <Route path="/solution/:id/reports" element={<Reports />} />

                        </Route>

                    </Route>



                    <Route

                        path="*"

                        element={

                            <Suspense fallback={<AuthRouteFallback />}>

                                <LoginPage />

                            </Suspense>

                        }

                    />

                </Routes>
                    <InstallPwaPrompt />
                </AlertProvider>
            </ThemeProvider>
        </Router>
    );
};



export default App;

