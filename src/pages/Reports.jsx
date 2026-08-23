import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Container, Button, Form, Row, Col, Table, Alert } from '../components/ui';
import { useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../api/http';
import { useAlert } from '../context/alertContext';
import { fetchAndExport, isIOSDevice } from '../utils/export';
import { formatDate } from '../utils/formatDate';
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

function todayIsoDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function shiftIsoDate(isoDate, deltaDays) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + deltaDays);
    const yy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, '0');
    const dd = String(next.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
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

function DailyEntryMobileList({ items, amountKey = 'amount' }) {
    return (
        <div className="mobile-data-card-list report-mobile-list">
            {items.map((item, idx) => (
                <article
                    key={item.id || item.expenseId || `${item.name || item.expenseName}-${idx}`}
                    className="mobile-data-card report-mobile-card report-mobile-card--compact"
                >
                    <div className="mobile-data-card__accent" aria-hidden />
                    <div className="mobile-data-card__body">
                        <header className="mobile-data-card__header">
                            <h3 className="mobile-data-card__title">
                                {item.name || item.expenseName || '—'}
                            </h3>
                            <span className="mobile-data-card__badge">
                                {String(item.paymentMethod || 'cash').toUpperCase()}
                            </span>
                        </header>
                        <div className="report-mobile-card__row">
                            <span className="text-muted text-sm">
                                {item.category || formatDate(item.date || item.paidAt)}
                            </span>
                            <div className="report-mobile-card__amount">
                                {formatCurrency(item[amountKey])}
                            </div>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function Reports() {
    const { id: solutionId } = useParams();
    const { notifyError, notifySuccess } = useAlert();
    const mobileView = useMobileView();

    const [mode, setMode] = useState('daily');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(null);
    const [data, setData] = useState(null);
    const [daily, setDaily] = useState(null);
    const [error, setError] = useState('');

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 12 }, (_, i) => currentYear - 8 + i);
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState('');
    const [dailyDate, setDailyDate] = useState(todayIsoDate);

    const overviewCacheRef = useRef(new Map());
    const dailyCacheRef = useRef(new Map());
    const notifyErrorRef = useRef(notifyError);
    notifyErrorRef.current = notifyError;

    const loadOverview = useCallback(async () => {
        const cacheKey = `${year}-${month || 'all'}`;
        const cached = overviewCacheRef.current.get(cacheKey);
        if (cached) {
            setData(cached);
            setLoading(false);
            setError('');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const params = { year };
            if (month) params.month = month;
            const res = await api.get(`/reports/${solutionId}`, { params });
            overviewCacheRef.current.set(cacheKey, res.data);
            setData(res.data);
        } catch (err) {
            const msg = err.response?.data?.error?.message || 'Failed to load reports';
            setError(msg);
            notifyErrorRef.current(msg);
        } finally {
            setLoading(false);
        }
    }, [solutionId, year, month]);

    const loadDaily = useCallback(async () => {
        const cached = dailyCacheRef.current.get(dailyDate);
        if (cached) {
            setDaily(cached);
            setLoading(false);
            setError('');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/reports/${solutionId}/daily`, {
                params: { date: dailyDate },
            });
            dailyCacheRef.current.set(dailyDate, res.data);
            setDaily(res.data);
        } catch (err) {
            const msg = err.response?.data?.error?.message || 'Failed to load daily report';
            setError(msg);
            notifyErrorRef.current(msg);
        } finally {
            setLoading(false);
        }
    }, [solutionId, dailyDate]);

    useEffect(() => {
        if (!solutionId) return;
        if (mode === 'daily') loadDaily();
        else loadOverview();
    }, [solutionId, mode, loadDaily, loadOverview]);

    const handleExport = async (type, format) => {
        const key = `${type}-${format}`;
        setExporting(key);
        try {
            const params =
                type === 'daily'
                    ? { date: dailyDate }
                    : { year, ...(month ? { month } : {}) };

            const result = await fetchAndExport(api, solutionId, type, format, params);

            if (result?.method === 'cancelled') return;

            if (format === 'pdf' || result?.method === 'preview') {
                notifySuccess(
                    isIOSDevice()
                        ? 'Report opened — tap Save as PDF, then share to Files.'
                        : 'Report opened — use Print / Save PDF.'
                );
            } else if (result?.method === 'share') {
                notifySuccess('Export shared successfully.');
            } else if (isIOSDevice() && format === 'excel') {
                notifySuccess('Use the Share sheet to save the Excel file to Files.');
            }
        } catch (err) {
            notifyError(err.response?.data?.error?.message || err.message || 'Export failed');
        } finally {
            setExporting(null);
        }
    };

    const exportBtn = (type, format, label) => {
        const key = `${type}-${format}`;
        const busy = exporting === key;
        return (
            <Button
                variant="outline-primary"
                size="sm"
                disabled={Boolean(exporting)}
                onClick={() => handleExport(type, format)}
            >
                {busy ? 'Exporting…' : label}
            </Button>
        );
    };

    if (loading && ((mode === 'daily' && !daily) || (mode === 'overview' && !data))) {
        return <SkeletonReportsPage />;
    }
    if (error && ((mode === 'daily' && !daily) || (mode === 'overview' && !data))) {
        return <Alert variant="danger">{error}</Alert>;
    }

    const dayRemaining = Number(daily?.dayRemaining || 0);
    const overallRemaining = Number(daily?.overall?.remaining || 0);

    return (
        <Container className="page-shell reports-page py-2">
            <div className="page-header reports-page__header">
                <div>
                    <h1 className="page-heading">Reports</h1>
                    <p className="page-sub">
                        {mode === 'daily'
                            ? 'Day collected, day spent, and how much is left to spend.'
                            : 'Month/year breakdown and who paid what.'}
                    </p>
                </div>
                <div className="report-export-bar d-flex flex-wrap gap-2">
                    {mode === 'daily' ? (
                        <>
                            {exportBtn('daily', 'excel', 'Daily Excel')}
                            {exportBtn('daily', 'pdf', 'Daily PDF')}
                        </>
                    ) : (
                        <>
                            {exportBtn('summary', 'excel', 'Summary Excel')}
                            {exportBtn('summary', 'pdf', 'Summary PDF')}
                            {exportBtn('expenses', 'excel', 'Expenses Excel')}
                            {exportBtn('expenses', 'pdf', 'Expenses PDF')}
                            {exportBtn('collected-cash', 'excel', 'Cash Excel')}
                        </>
                    )}
                </div>
            </div>

            <div className="reports-page__toolbar">
                <div className="report-mode-tabs" role="tablist" aria-label="Report type">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'daily'}
                        className={`report-mode-tab${mode === 'daily' ? ' is-active' : ''}`}
                        onClick={() => setMode('daily')}
                    >
                        Daily
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'overview'}
                        className={`report-mode-tab${mode === 'overview' ? ' is-active' : ''}`}
                        onClick={() => setMode('overview')}
                    >
                        Overview
                    </button>
                </div>

                {mode === 'daily' && (
                    <div className="daily-report-controls">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setDailyDate((d) => shiftIsoDate(d, -1))}
                            aria-label="Previous day"
                        >
                            <FaChevronLeft />
                        </Button>

                        <label className="et-date-filter daily-report-date">
                            <span className="et-date-filter__label">Date</span>
                            <input
                                type="date"
                                className="et-date-filter__input form-control form-control-sm"
                                value={dailyDate}
                                onChange={(e) => setDailyDate(e.target.value || todayIsoDate())}
                                aria-label="Report date"
                            />
                            <span
                                className={`et-date-filter__display${dailyDate ? '' : ' et-date-filter__display--empty'}`}
                                aria-hidden
                            >
                                {dailyDate ? formatDate(dailyDate) : 'dd-mm-yyyy'}
                            </span>
                        </label>

                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setDailyDate((d) => shiftIsoDate(d, 1))}
                            aria-label="Next day"
                        >
                            <FaChevronRight />
                        </Button>

                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setDailyDate(todayIsoDate())}
                        >
                            Today
                        </Button>
                    </div>
                )}
            </div>

            {mode === 'daily' && daily && (
                <>
                    <div className="daily-report-hero">
                        <div className="stat-tile stat-tile--compact">
                            <div className="stat-label">Collected today</div>
                            <div className="stat-value text-success">
                                {formatCurrency(daily.collected?.total)}
                            </div>
                            <div className="stat-sub">
                                Cash {formatCurrency(daily.collected?.cash)} · UPI{' '}
                                {formatCurrency(daily.collected?.upi)}
                            </div>
                        </div>
                        <div className="stat-tile stat-tile--compact">
                            <div className="stat-label">Spent today</div>
                            <div className="stat-value text-warning">
                                {formatCurrency(daily.spent?.total)}
                            </div>
                            <div className="stat-sub">
                                Cash {formatCurrency(daily.spent?.cash)} · UPI{' '}
                                {formatCurrency(daily.spent?.upi)}
                            </div>
                        </div>
                        <div
                            className={`stat-tile stat-tile--compact daily-report-left ${
                                dayRemaining < 0 ? 'remaining-danger' : 'remaining-success'
                            }`}
                        >
                            <div className="stat-label">Left today</div>
                            <div className="stat-value">{formatCurrency(dayRemaining)}</div>
                            <div className="stat-sub">Collected today − spent today</div>
                        </div>
                    </div>

                    <div
                        className={`daily-report-wallet ${
                            overallRemaining < 0 ? 'remaining-danger' : 'remaining-success'
                        }`}
                    >
                        <div>
                            <div className="stat-label">Overall wallet left</div>
                            <div className="daily-report-wallet__value">
                                {formatCurrency(overallRemaining)}
                            </div>
                        </div>
                        <div className="daily-report-wallet__meta">
                            All-time collected {formatCurrency(daily.overall?.collected)} −
                            all-time expenses {formatCurrency(daily.overall?.expenses)}
                        </div>
                    </div>

                    <div className="daily-report-lists">
                        <div className="page-surface reports-panel">
                            <h5 className="reports-panel__title">Collected today</h5>
                            {daily.collectedEntries?.length ? (
                                mobileView ? (
                                    <DailyEntryMobileList
                                        items={daily.collectedEntries}
                                        amountKey="amount"
                                    />
                                ) : (
                                    <Table responsive striped hover className="mb-0 et-data-table">
                                        <thead>
                                            <tr>
                                                <th className="et-table-cell--left">Name</th>
                                                <th className="et-table-cell--right et-table-cell--currency">
                                                    Amount
                                                </th>
                                                <th className="et-table-cell--left">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {daily.collectedEntries.map((c) => (
                                                <tr key={c.id}>
                                                    <td className="et-table-cell--left">{c.name}</td>
                                                    <td className="et-table-cell--right et-table-cell--currency">
                                                        {formatCurrency(c.amount)}
                                                    </td>
                                                    <td className="et-table-cell--left">
                                                        {String(c.paymentMethod || 'cash').toUpperCase()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )
                            ) : (
                                <p className="reports-empty">No money collected on this day.</p>
                            )}
                        </div>

                        <div className="page-surface reports-panel">
                            <h5 className="reports-panel__title">Spent today</h5>
                            {daily.payments?.length ? (
                                mobileView ? (
                                    <DailyEntryMobileList
                                        items={daily.payments}
                                        amountKey="paidAmount"
                                    />
                                ) : (
                                    <Table responsive striped hover className="mb-0 et-data-table">
                                        <thead>
                                            <tr>
                                                <th className="et-table-cell--left">Expense</th>
                                                <th className="et-table-cell--left">Category</th>
                                                <th className="et-table-cell--right et-table-cell--currency">
                                                    Paid
                                                </th>
                                                <th className="et-table-cell--left">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {daily.payments.map((p, idx) => (
                                                <tr key={`${p.expenseId}-${p.paidAt}-${idx}`}>
                                                    <td className="et-table-cell--left">
                                                        {p.expenseName}
                                                    </td>
                                                    <td className="et-table-cell--left">
                                                        {p.category}
                                                    </td>
                                                    <td className="et-table-cell--right et-table-cell--currency">
                                                        {formatCurrency(p.paidAmount)}
                                                    </td>
                                                    <td className="et-table-cell--left">
                                                        {String(p.paymentMethod || 'cash').toUpperCase()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )
                            ) : (
                                <p className="reports-empty">No payments recorded on this day.</p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {mode === 'overview' && (
                <>
                    <Row className="g-2 reports-overview-filters">
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
                                <Form.Select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                >
                                    <option value="">Full year</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleString('default', {
                                                month: 'long',
                                            })}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {data && (
                        <>
                            <div className="daily-report-hero reports-overview-stats">
                                <div className="stat-tile stat-tile--compact">
                                    <div className="stat-label">Total collected</div>
                                    <div className="stat-value text-success">
                                        {formatCurrency(data.totalCollected)}
                                    </div>
                                </div>
                                <div className="stat-tile stat-tile--compact">
                                    <div className="stat-label">Total expenses</div>
                                    <div className="stat-value text-warning">
                                        {formatCurrency(data.totalExpenses)}
                                    </div>
                                </div>
                                <div
                                    className={`stat-tile stat-tile--compact ${
                                        data.remaining < 0
                                            ? 'remaining-danger'
                                            : 'remaining-success'
                                    }`}
                                >
                                    <div className="stat-label">Remaining</div>
                                    <div className="stat-value">
                                        {formatCurrency(data.remaining)}
                                    </div>
                                </div>
                            </div>

                            <div className="daily-report-lists">
                                <div className="page-surface reports-panel">
                                    <h5 className="reports-panel__title">Who paid what</h5>
                                    {data.whoPaidWhat?.length ? (
                                        mobileView ? (
                                            <WhoPaidMobileList items={data.whoPaidWhat} />
                                        ) : (
                                            <Table
                                                responsive
                                                striped
                                                hover
                                                className="mb-0 et-data-table"
                                            >
                                                <thead>
                                                    <tr>
                                                        <th className="et-table-cell--left">Name</th>
                                                        <th className="et-table-cell--left">Email</th>
                                                        <th className="et-table-cell--right et-table-cell--currency">
                                                            Total paid
                                                        </th>
                                                        <th className="et-table-cell--right">
                                                            Expenses
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.whoPaidWhat.map((p) => (
                                                        <tr key={p.userId || p.email}>
                                                            <td className="et-table-cell--left">
                                                                {p.name}
                                                            </td>
                                                            <td className="et-table-cell--left">
                                                                {p.email}
                                                            </td>
                                                            <td className="et-table-cell--right et-table-cell--currency">
                                                                {formatCurrency(p.totalPaid)}
                                                            </td>
                                                            <td className="et-table-cell--right">
                                                                {p.expenseCount}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )
                                    ) : (
                                        <p className="reports-empty">
                                            No payment data for this period.
                                        </p>
                                    )}
                                </div>

                                <div className="page-surface reports-panel">
                                    <h5 className="reports-panel__title">Monthly expense trend</h5>
                                    {data.monthlyBreakdown?.length ? (
                                        mobileView ? (
                                            <MonthlyTrendMobileList items={data.monthlyBreakdown} />
                                        ) : (
                                            <Table responsive striped className="mb-0 et-data-table">
                                                <thead>
                                                    <tr>
                                                        <th className="et-table-cell--left">Month</th>
                                                        <th className="et-table-cell--right et-table-cell--currency">
                                                            Total
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.monthlyBreakdown.map((m) => (
                                                        <tr key={`${m.year}-${m.month}`}>
                                                            <td className="et-table-cell--left">
                                                                {new Date(
                                                                    m.year,
                                                                    m.month - 1
                                                                ).toLocaleString('default', {
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                })}
                                                            </td>
                                                            <td className="et-table-cell--right et-table-cell--currency">
                                                                {formatCurrency(m.total)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )
                                    ) : (
                                        <p className="reports-empty">No monthly data yet.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </Container>
    );
}
