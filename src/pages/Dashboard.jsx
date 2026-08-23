import React, { useEffect, useState, lazy, Suspense } from 'react';
import api from '../api/http';
import { Alert, Row, Col, Spinner } from '../components/ui';
import { useParams } from 'react-router-dom';
import { SkeletonDashboard } from '../components/Skeleton';
import { formatDate } from '../utils/formatDate';

const Chart = lazy(() => import('react-apexcharts'));

const Dashboard = () => {
    const { id: solutionCardId } = useParams();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/dashboard/${solutionCardId}`);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.error?.message || 'Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        if (solutionCardId) fetchDashboard();
    }, [solutionCardId]);

    if (loading) {
        return <SkeletonDashboard />;
    }

    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!data) return null;

    const {
        totalCollectedCash,
        totalExpenses,
        remainingBudget,
        recentExpenses,
        recentCollectedCash,
        percentageSpent,
    } = data;

    const pieLabels = ['Total Expenses', 'Total Collected Cash'];
    const pieSeries = [totalExpenses, totalCollectedCash];

    const pieOptions = {
        labels: pieLabels,
        colors: ['#ea580c', '#0f766e'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true },
        chart: { fontFamily: 'Outfit, system-ui, sans-serif' },
        tooltip: {
            y: {
                formatter: (val) => `₹${val.toLocaleString()}`,
            },
        },
    };

    const remainingTone = remainingBudget < 0 ? 'danger' : 'success';

    return (
        <div className="dashboard-page page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-heading">Budget overview</h1>
                    <p className="page-sub">Totals, mix, and recent activity for this solution.</p>
                </div>
            </div>

            <Row className="mb-4 g-3">
                <Col md={4} sm={12}>
                    <div className="stat-tile">
                        <div className="stat-label">Total Collected Cash</div>
                        <div className="stat-value text-success">
                            ₹{totalCollectedCash.toLocaleString()}
                        </div>
                    </div>
                </Col>
                <Col md={4} sm={12}>
                    <div className="stat-tile">
                        <div className="stat-label">Total Expenses</div>
                        <div className="stat-value text-warning">
                            ₹{totalExpenses.toLocaleString()}
                        </div>
                    </div>
                </Col>
                <Col md={4} sm={12}>
                    <div className={`stat-tile remaining-${remainingTone}`}>
                        <div className="stat-label">Remaining Budget</div>
                        <div className="d-flex justify-content-between align-items-end gap-2 flex-wrap">
                            <div className="stat-value">₹{remainingBudget.toLocaleString()}</div>
                            <div className="stat-sub">{percentageSpent}% spent</div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row className="g-3">
                <Col xs={12} lg={6}>
                    <div className="page-surface h-100">
                        <h5 className="mb-3">Expense vs Collected Cash</h5>
                        <Suspense
                            fallback={
                                <div className="d-flex justify-content-center py-5">
                                    <Spinner size="sm" />
                                </div>
                            }
                        >
                            <Chart options={pieOptions} series={pieSeries} type="pie" height={320} />
                        </Suspense>
                    </div>
                </Col>

                <Col xs={12} lg={6}>
                    <Row className="g-3">
                        <Col xs={12} md={6}>
                            <div className="page-surface h-100">
                                <h5 className="mb-2">Recent Expenses</h5>
                                {recentExpenses.length === 0 ? (
                                    <p className="mb-0 text-muted">No recent expenses</p>
                                ) : (
                                    recentExpenses.map((expense) => (
                                        <div className="recent-item" key={expense.id || expense._id}>
                                            <span className="fw-semibold">{expense.name}</span>
                                            <div className="recent-meta">
                                                <span className="text-warning">
                                                    ₹{expense.amount.toLocaleString()}
                                                </span>
                                                <span>
                                                    {formatDate(expense.date || expense.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Col>
                        <Col xs={12} md={6}>
                            <div className="page-surface h-100">
                                <h5 className="mb-2">Recent Collected Cash</h5>
                                {recentCollectedCash.length === 0 ? (
                                    <p className="mb-0 text-muted">No recent collected cash</p>
                                ) : (
                                    recentCollectedCash.map((cash) => (
                                        <div className="recent-item" key={cash.id || cash._id}>
                                            <span className="fw-semibold">{cash.name}</span>
                                            <div className="recent-meta">
                                                <span className="text-success">
                                                    ₹{cash.amount.toLocaleString()}
                                                </span>
                                                <span>
                                                    {formatDate(cash.date || cash.collectedDate)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
