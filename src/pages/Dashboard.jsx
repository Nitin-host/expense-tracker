import React, { useEffect, useState } from 'react';
import api from '../api/http';
import { Card, Spinner, Alert, Row, Col, ListGroup } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Chart from 'react-apexcharts';
import '../styles/Dashboard.scss';

const Dashboard = () => {
    const { id: solutionCardId } = useParams();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch dashboard data when solutionCardId changes
    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/dashboard/${solutionCardId}`);
                setData(res.data);
            } catch {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        if (solutionCardId) fetchDashboard();
    }, [solutionCardId]);

    if (loading)
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );

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

    // Pie chart data for Expenses vs Collected Cash
    const pieLabels = ['Expenses', 'Collected Cash'];
    const pieSeries = [
        recentExpenses.reduce((sum, e) => sum + e.amount, 0),
        recentCollectedCash.reduce((sum, c) => sum + c.amount, 0),
    ];

    const pieOptions = {
        labels: pieLabels,
        colors: ['#FF9800', '#189708f1'], // Orange and green
        legend: { position: 'bottom' },
        dataLabels: { enabled: true },
        tooltip: {
            y: {
                formatter: (val) => `₹${val.toLocaleString()}`,
            },
        },
    };

    // Determine remaining budget card color
    const remainingColor = remainingBudget < 0 ? 'danger' : 'success';

    return (
        <>
            <h4>Solution Budget Dashboard</h4>

            {/* Top Summary Cards */}
            <Row className="mb-4">
                {/* Total Collected Cash */}
                <Col md={4} sm={12} className="mb-3">
                    <Card className="dashboard-card shadow-sm border-success">
                        <Card.Body>
                            <Card.Title>Total Collected Cash (Budget)</Card.Title>
                            <h3 className="text-success">
                                ₹{totalCollectedCash.toLocaleString()}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Total Expenses */}
                <Col md={4} sm={12} className="mb-3">
                    <Card className="shadow-sm border-warning">
                        <Card.Body>
                            <Card.Title>Total Expenses</Card.Title>
                            <h3 className="text-warning">₹{totalExpenses.toLocaleString()}</h3>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Remaining Budget */}
                <Col md={4} sm={12} className="mb-3">
                    <Card bg={remainingColor} text="white" className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Remaining Budget</Card.Title>
                            <Row>
                                <Col>
                                    <h3>₹{remainingBudget.toLocaleString()}</h3>
                                </Col>
                                <Col className="text-end mt-2">
                                    <h6>{percentageSpent}% Spend</h6>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Pie Chart and Recent Lists */}
            <Row>
                {/* Pie Chart: Expense vs Collected Cash */}
                <Col xs={12} md={8} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Expense vs Collected Cash</Card.Title>
                            <Chart options={pieOptions} series={pieSeries} type="pie" height={350} />
                        </Card.Body>
                    </Card>

                </Col>
                <Col xs={12} md={4}>
                    {/* Recent Expenses List */}
                    <Card className="shadow-sm mt-4">
                        <Card.Body>
                            <Card.Title>Recent Expenses Added</Card.Title>
                            {recentExpenses.length === 0 ? (
                                <p>No recent expenses</p>
                            ) : (
                                <ListGroup>
                                    {recentExpenses.map((expense) => (
                                        <ListGroup.Item key={expense.id}>
                                            <span className="fw-bold">{expense.name}</span>
                                            <span className="float-end text-warning">
                                                ₹{expense.amount.toLocaleString()} –{' '}
                                                {new Date(expense.date).toLocaleDateString()}
                                            </span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Recent Collected Cash List */}
                <Col xs={12} md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Recent Collected Cash Added</Card.Title>
                            {recentCollectedCash.length === 0 ? (
                                <p>No recent collected cash</p>
                            ) : (
                                <ListGroup>
                                    {recentCollectedCash.map((cash) => (
                                        <ListGroup.Item key={cash.id}>
                                            <span className="fw-bold">{cash.name}</span>
                                            <span className="float-end text-success">
                                                ₹{cash.amount.toLocaleString()} –{' '}
                                                {new Date(cash.date).toLocaleDateString()}
                                            </span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default Dashboard;
