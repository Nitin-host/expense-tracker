import React, { useEffect, useState } from 'react';
import api from '../api/http';
import { Card, Spinner, Alert, Row, Col, ListGroup } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Chart from 'react-apexcharts';

const Dashboard = () => {
    const { id: solutionCardId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchDashboard() {
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
        }
        if (solutionCardId) fetchDashboard();
    }, [solutionCardId]);

    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!data) return null;

    const {
        totalCollectedCash,
        totalExpenses,
        remainingBudget,
        recentExpenses,
        recentCollectedCash,
    } = data;

    const categories = recentExpenses.map(e => e.name || e.date);
    const expenseAmounts = recentExpenses.map(e => e.amount);
    const collectedAmounts = categories.map((_, idx) =>
        recentCollectedCash[idx] ? recentCollectedCash[idx].amount : 0
    );

    const mixedOptions = {
        chart: {
            height: 350,
            type: 'line',
            stacked: false,
            toolbar: { show: false }
        },
        dataLabels: {
            enabled: true,
            enabledOnSeries: [1]
        },
        stroke: { width: [0, 4] },
        xaxis: { categories },
        yaxis: [
            { title: { text: "Expenses (₹)" }, labels: { style: { colors: "#FF9800" } } },
            { opposite: true, title: { text: "Collected Cash (₹)" }, labels: { style: { colors: "#2EC492" } } }
        ],
        colors: ["#FF9800", "#2EC492"],
        legend: { position: "top" }
    };

    const mixedSeries = [
        { name: "Expenses", type: "column", data: expenseAmounts },
        { name: "Collected Cash", type: "line", data: collectedAmounts }
    ];

    // Card colors
    const remainingColor = remainingBudget < 0 ? 'danger' : 'success';

    return (
        <>
            <h4>Solution Budget Dashboard</h4>

            <Row className="mb-4">
                <Col md={4} sm={12} className="mb-3">
                    <Card bg="light" text="dark" className="shadow-sm border-success">
                        <Card.Body>
                            <Card.Title>Total Collected Cash (Budget)</Card.Title>
                            <h3 className="text-success">₹{totalCollectedCash.toLocaleString()}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} sm={12} className="mb-3">
                    <Card bg="light" text="dark" className="shadow-sm border-warning">
                        <Card.Body>
                            <Card.Title>Total Expenses</Card.Title>
                            <h3 className="text-warning">₹{totalExpenses.toLocaleString()}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} sm={12} className="mb-3">
                    <Card bg={remainingColor} text="white" className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Remaining Budget</Card.Title>
                            <h3>₹{remainingBudget.toLocaleString()}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col xs={12} md={8} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Expenses vs Collected Cash Trend</Card.Title>
                            <Chart options={mixedOptions} series={mixedSeries} type="line" height={350} />
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm mt-4">
                        <Card.Body>
                            <Card.Title>Recent Expenses Added</Card.Title>
                            {recentExpenses.length === 0 ? (
                                <p>No recent expenses</p>
                            ) : (
                                <ListGroup>
                                    {recentExpenses.map(expense => (
                                        <ListGroup.Item key={expense.id}>
                                            <span className="fw-bold">{expense.name}</span>
                                            <span className="float-end text-warning">
                                                ₹{expense.amount.toLocaleString()}
                                                {" "}– {" "}
                                                {new Date(expense.date).toLocaleDateString()}
                                            </span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12} md={4} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Recent Collected Cash Added</Card.Title>
                            {recentCollectedCash.length === 0 ? (
                                <p>No recent collected cash</p>
                            ) : (
                                <ListGroup>
                                    {recentCollectedCash.map(cash => (
                                        <ListGroup.Item key={cash.id}>
                                            <span className="fw-bold">{cash.name}</span>
                                            <span className="float-end text-success">
                                                ₹{cash.amount.toLocaleString()}
                                                {" "}– {" "}
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
