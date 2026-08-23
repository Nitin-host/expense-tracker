import React, { useEffect, useState } from 'react';
import { Container, Button, Form, Row, Col, Table, Alert } from '../components/ui';
import { useParams } from 'react-router-dom';
import api from '../api/http';
import { useAlert } from '../context/alertContext';
import { fetchAndExport } from '../utils/export';
import { SkeletonReportsPage } from '../components/Skeleton';

const MOBILE_MQ = '(max-width: 767.98px)';

function useMobileView() {
    const [mobileView, setMobileView] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches
    );

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ);
        const onChange = (e) => setMobileView(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return mobileView;
}

function formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function WhoPaidMobileList({ items }) {
    return (
        <div className="mobile-data-card-list report-mobile-list">
            {items.map((p) => (
                <article key={p.userId || p.email} className="mobile-data-card report-mobile-card">
                    <div className="mobile-data-card__accent" aria-hidden />
                    <div className="mobile-data-card__body">
                        <header className="mobile-data-card__header">
                            <h3 className="mobile-data-card__title">{p.name || 'Unknown'}</h3>
                        </header>
                        <div className="mobile-data-card__metrics mobile-data-card__metrics--single">
                            <div className="mobile-data-card__metric">
                                <span className="mobile-data-card__metric-label">Total paid</span>
                                <span className="mobile-data-card__metric-value">
                                    {formatCurrency(p.totalPaid)}
                                </span>
                            </div>
                        </div>
                        <dl className="mobile-data-card__details">
                            <div className="mobile-data-card__detail-row">
                                <dt>Email</dt>
                                <dd>{p.email || '—'}</dd>
                            </div>
                            <div className="mobile-data-card__detail-row">
                                <dt>Expenses</dt>
                                <dd>{p.expenseCount ?? 0}</dd>
                            </div>
                        </dl>
                    </div>
                </article>
            ))}
        </div>
    );
}

function MonthlyTrendMobileList({ items }) {
    return (
        <div className="mobile-data-card-list report-mobile-list">
            {items.map((m) => {
                const label = new Date(m.year, m.month - 1).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                });
                return (
                    <article
                        key={`${m.year}-${m.month}`}
                        className="mobile-data-card report-mobile-card report-mobile-card--compact"
                    >
                        <div className="mobile-data-card__accent" aria-hidden />
                        <div className="mobile-data-card__body report-mobile-card__row">
                            <div className="report-mobile-card__month">{label}</div>
                            <div className="report-mobile-card__amount">{formatCurrency(m.total)}</div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

export default function Reports() {
    const { id: solutionId } = useParams();
    const { notifyError } = useAlert();
    const mobileView = useMobileView();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 12 }, (_, i) => currentYear - 8 + i);
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { year };
            if (month) params.month = month;
            const res = await api.get(`/reports/${solutionId}`, { params });
            setData(res.data);
        } catch (err) {
            const msg = err.response?.data?.error?.message || 'Failed to load reports';
            setError(msg);
            notifyError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type, format) => {
        try {
            const params = { year };
            if (month) params.month = month;
            await fetchAndExport(api, solutionId, type, format, params);
        } catch (err) {
            notifyError(err.response?.data?.error?.message || err.message || 'Export failed');
        }
    };

    useEffect(() => {
        if (solutionId) load();
    }, [solutionId, year, month]);

    if (loading && !data) return <SkeletonReportsPage />;
    if (error && !data) return <Alert variant="danger">{error}</Alert>;

    return (
        <Container className="page-shell py-2">
            <div className="page-header">
                <div>
                    <h1 className="page-heading">Reports</h1>
                    <p className="page-sub">Month/year breakdown and who paid what.</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleExport('summary', 'excel')}
                    >
                        Summary Excel
                    </Button>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleExport('summary', 'pdf')}
                    >
                        Summary PDF
                    </Button>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleExport('expenses', 'excel')}
                    >
                        Expenses Excel
                    </Button>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleExport('expenses', 'pdf')}
                    >
                        Expenses PDF
                    </Button>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleExport('collected-cash', 'excel')}
                    >
                        Cash Excel
                    </Button>
                </div>
            </div>

            <Row className="g-3 mb-3">
                <Col xs={6} md={3}>
                    <Form.Group>
                        <Form.Label>Year</Form.Label>
                        <Form.Select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col xs={6} md={3}>
                    <Form.Group>
                        <Form.Label>Month (optional)</Form.Label>
                        <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                            <option value="">Full year</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {data && (
                <>
                    <Row className="g-3 mb-4">
                        <Col xs={12} md={4}>
                            <div className="stat-tile">
                                <div className="stat-label">Total collected</div>
                                <div className="stat-value">₹{Number(data.totalCollected).toFixed(2)}</div>
                            </div>
                        </Col>
                        <Col xs={12} md={4}>
                            <div className="stat-tile">
                                <div className="stat-label">Total expenses</div>
                                <div className="stat-value">₹{Number(data.totalExpenses).toFixed(2)}</div>
                            </div>
                        </Col>
                        <Col xs={12} md={4}>
                            <div className={`stat-tile ${data.remaining < 0 ? 'remaining-danger' : 'remaining-success'}`}>
                                <div className="stat-label">Remaining</div>
                                <div className="stat-value">₹{Number(data.remaining).toFixed(2)}</div>
                            </div>
                        </Col>
                    </Row>

                    <div className="page-surface mb-4">
                        <h5 className="mb-3 font-semibold">Who paid what</h5>
                        {data.whoPaidWhat?.length ? (
                            mobileView ? (
                                <WhoPaidMobileList items={data.whoPaidWhat} />
                            ) : (
                                <Table responsive striped hover className="mb-0 et-data-table">
                                    <thead>
                                        <tr>
                                            <th className="et-table-cell--left">Name</th>
                                            <th className="et-table-cell--left">Email</th>
                                            <th className="et-table-cell--right et-table-cell--currency">Total paid</th>
                                            <th className="et-table-cell--right">Expenses</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.whoPaidWhat.map((p) => (
                                            <tr key={p.userId || p.email}>
                                                <td className="et-table-cell--left">{p.name}</td>
                                                <td className="et-table-cell--left">{p.email}</td>
                                                <td className="et-table-cell--right et-table-cell--currency">{formatCurrency(p.totalPaid)}</td>
                                                <td className="et-table-cell--right">{p.expenseCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )
                        ) : (
                            <Alert variant="light">No payment data for this period.</Alert>
                        )}
                    </div>

                    <div className="page-surface">
                        <h5 className="mb-3 font-semibold">Monthly expense trend</h5>
                        {data.monthlyBreakdown?.length ? (
                            mobileView ? (
                                <MonthlyTrendMobileList items={data.monthlyBreakdown} />
                            ) : (
                                <Table responsive striped className="mb-0 et-data-table">
                                    <thead>
                                        <tr>
                                            <th className="et-table-cell--left">Month</th>
                                            <th className="et-table-cell--right et-table-cell--currency">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.monthlyBreakdown.map((m) => (
                                            <tr key={`${m.year}-${m.month}`}>
                                                <td className="et-table-cell--left">
                                                    {new Date(m.year, m.month - 1).toLocaleString('default', {
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="et-table-cell--right et-table-cell--currency">{formatCurrency(m.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )
                        ) : (
                            <Alert variant="light">No monthly data yet.</Alert>
                        )}
                    </div>
                </>
            )}
        </Container>
    );
}
