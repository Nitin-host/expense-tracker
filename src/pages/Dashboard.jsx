import React, { useContext, useEffect, useState, lazy, Suspense, useMemo } from 'react';
import api from '../api/http';
import { Alert, Spinner } from '../components/ui';
import { useParams } from 'react-router-dom';
import { SkeletonDashboard } from '../components/Skeleton';
import { formatDate } from '../utils/formatDate';
import { ThemeContext } from '../utils/ThemeContext';

const Chart = lazy(() => import('react-apexcharts'));

const CHART_HEIGHT_DESKTOP = 220;
const CHART_HEIGHT_MOBILE = 260;

const chartFallback = (
    <div className="dashboard-chart-fallback">
        <Spinner size="sm" />
    </div>
);

function chartBaseConfig(textColor) {
    return {
        fontFamily: 'Outfit, system-ui, sans-serif',
        offsetY: -4,
        foreColor: textColor,
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: false, dynamicAnimation: { enabled: false } },
    };
}

function buildMethodDonutOptions({ totalLabel, totalValue, textColor, mutedColor, isDark }) {
    return {
        labels: ['Cash', 'UPI'],
        colors: ['#0f766e', '#0284c7'],
        theme: { mode: isDark ? 'dark' : 'light' },
        legend: {
            position: 'bottom',
            offsetY: 2,
            fontSize: '12px',
            itemMargin: { horizontal: 8, vertical: 0 },
            labels: { colors: textColor },
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${Math.round(val)}%`,
        },
        chart: chartBaseConfig(textColor),
        plotOptions: {
            pie: {
                donut: {
                    size: '58%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '11px',
                            color: mutedColor,
                            offsetY: -2,
                        },
                        value: {
                            show: true,
                            fontSize: '13px',
                            fontWeight: 600,
                            color: textColor,
                            offsetY: 2,
                            formatter: (val) => `₹${Number(val).toLocaleString()}`,
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: totalLabel,
                            fontSize: '12px',
                            fontWeight: 700,
                            color: textColor,
                            formatter: () => `₹${Number(totalValue).toLocaleString()}`,
                        },
                    },
                },
            },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) => `₹${Number(val).toLocaleString()}`,
            },
        },
    };
}

function MethodStat({ label, value, count, countLabel, tone = 'cash' }) {
    return (
        <div className="stat-tile stat-tile--compact">
            <div className="stat-label">{label}</div>
            <div className={`stat-value stat-value--${tone}`}>₹{value.toLocaleString()}</div>
            <div className="stat-sub">
                {count} {countLabel}
                {count === 1 ? '' : 's'}
            </div>
        </div>
    );
}

function RecentList({ title, emptyText, items, amountClass, renderMeta }) {
    return (
        <div className="page-surface dashboard-activity-card">
            <h5 className="dashboard-section-title">{title}</h5>
            {items.length === 0 ? (
                <p className="mb-0 text-muted dashboard-empty">{emptyText}</p>
            ) : (
                <div className="dashboard-recent-list">
                    {items.map((item) => (
                        <div className="recent-item" key={item.id || item._id}>
                            <span className="fw-semibold">{item.name}</span>
                            <div className="recent-meta">
                                <span className={amountClass}>
                                    ₹{item.amount.toLocaleString()}
                                </span>
                                {renderMeta?.(item)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const Dashboard = () => {
    const { id: solutionCardId } = useParams();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';
    const chartText = isDark ? '#e8eef7' : '#0f172a';
    const chartMuted = isDark ? '#94a3b8' : '#64748b';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [chartHeight, setChartHeight] = useState(CHART_HEIGHT_DESKTOP);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 992px)');
        const sync = () =>
            setChartHeight(mq.matches ? CHART_HEIGHT_DESKTOP : CHART_HEIGHT_MOBILE);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

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

    const methodCharts = useMemo(() => {
        if (!data) return null;

        const expenseSummary = data.paymentMethodSummary || {};
        const collectedSummary = data.collectedPaymentMethodSummary || {};

        const expenseCash = Number(expenseSummary.cash) || 0;
        const expenseUpi = Number(expenseSummary.upi) || 0;
        const expenseTotal =
            Number(expenseSummary.totalPaid) || expenseCash + expenseUpi;

        const collectedCash = Number(collectedSummary.cash) || 0;
        const collectedUpi = Number(collectedSummary.upi) || 0;
        const collectedTotal =
            Number(collectedSummary.totalCollected) || collectedCash + collectedUpi;

        return {
            expenseCash,
            expenseUpi,
            expenseTotal,
            expenseCashCount: expenseSummary.cashCount || 0,
            expenseUpiCount: expenseSummary.upiCount || 0,
            collectedCash,
            collectedUpi,
            collectedTotal,
            collectedCashCount: collectedSummary.cashCount || 0,
            collectedUpiCount: collectedSummary.upiCount || 0,
            expenseOptions: buildMethodDonutOptions({
                totalLabel: 'Paid',
                totalValue: expenseTotal,
                textColor: chartText,
                mutedColor: chartMuted,
                isDark,
            }),
            collectedOptions: buildMethodDonutOptions({
                totalLabel: 'Collected',
                totalValue: collectedTotal,
                textColor: chartText,
                mutedColor: chartMuted,
                isDark,
            }),
        };
    }, [data, chartText, chartMuted, isDark]);

    const pieOptions = useMemo(
        () => ({
            labels: ['Total Expenses', 'Total Collected Cash'],
            colors: ['#ea580c', '#0f766e'],
            theme: { mode: isDark ? 'dark' : 'light' },
            legend: {
                position: 'bottom',
                offsetY: 2,
                fontSize: '12px',
                itemMargin: { horizontal: 8, vertical: 0 },
                labels: { colors: chartText },
            },
            dataLabels: { enabled: true },
            chart: chartBaseConfig(chartText),
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: (val) => `₹${Number(val).toLocaleString()}`,
                },
            },
        }),
        [isDark, chartText]
    );

    if (loading) return <SkeletonDashboard />;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!data || !methodCharts) return null;

    const {
        totalCollectedCash,
        totalExpenses,
        remainingBudget,
        recentExpenses,
        recentCollectedCash,
        percentageSpent,
    } = data;

    const remainingTone = remainingBudget < 0 ? 'danger' : 'success';
    const hasExpenseMethodData = methodCharts.expenseCash > 0 || methodCharts.expenseUpi > 0;
    const hasCollectedMethodData =
        methodCharts.collectedCash > 0 || methodCharts.collectedUpi > 0;

    return (
        <div className="dashboard-page page-shell">
            <div className="page-header dashboard-page__header">
                <div>
                    <h1 className="page-heading">Budget overview</h1>
                    <p className="page-sub">Totals, mix, and recent activity for this solution.</p>
                </div>
            </div>

            <div className="dashboard-stats dashboard-stats--primary">
                <div className="stat-tile stat-tile--compact">
                    <div className="stat-label">Total Collected Cash</div>
                    <div className="stat-value text-success">
                        ₹{totalCollectedCash.toLocaleString()}
                    </div>
                </div>
                <div className="stat-tile stat-tile--compact">
                    <div className="stat-label">Total Expenses</div>
                    <div className="stat-value text-warning">
                        ₹{totalExpenses.toLocaleString()}
                    </div>
                </div>
                <div className={`stat-tile stat-tile--compact remaining-${remainingTone}`}>
                    <div className="stat-label">Remaining Budget</div>
                    <div className="dashboard-stat-row">
                        <div className="stat-value">₹{remainingBudget.toLocaleString()}</div>
                        <div className="stat-sub">{percentageSpent}% spent</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-stats dashboard-stats--methods">
                <MethodStat
                    label="Expenses · Cash"
                    value={methodCharts.expenseCash}
                    count={methodCharts.expenseCashCount}
                    countLabel="payment"
                    tone="cash"
                />
                <MethodStat
                    label="Expenses · UPI"
                    value={methodCharts.expenseUpi}
                    count={methodCharts.expenseUpiCount}
                    countLabel="payment"
                    tone="upi"
                />
                <MethodStat
                    label="Collected · Cash"
                    value={methodCharts.collectedCash}
                    count={methodCharts.collectedCashCount}
                    countLabel="entry"
                    tone="cash"
                />
                <MethodStat
                    label="Collected · UPI"
                    value={methodCharts.collectedUpi}
                    count={methodCharts.collectedUpiCount}
                    countLabel="entry"
                    tone="upi"
                />
            </div>

            <div className="dashboard-body">
                <div className="dashboard-charts">
                    <div className="page-surface dashboard-chart-card">
                        <h5 className="dashboard-section-title">Expense vs Collected</h5>
                        <Suspense fallback={chartFallback}>
                            <Chart
                                options={pieOptions}
                                series={[totalExpenses, totalCollectedCash]}
                                type="pie"
                                height={chartHeight}
                            />
                        </Suspense>
                    </div>

                    <div className="page-surface dashboard-chart-card">
                        <h5 className="dashboard-section-title">Expense · Cash vs UPI</h5>
                        {hasExpenseMethodData ? (
                            <Suspense fallback={chartFallback}>
                                <Chart
                                    options={methodCharts.expenseOptions}
                                    series={[methodCharts.expenseCash, methodCharts.expenseUpi]}
                                    type="donut"
                                    height={chartHeight}
                                />
                            </Suspense>
                        ) : (
                            <p className="dashboard-empty">No expense payments yet.</p>
                        )}
                    </div>

                    <div className="page-surface dashboard-chart-card">
                        <h5 className="dashboard-section-title">Collected · Cash vs UPI</h5>
                        {hasCollectedMethodData ? (
                            <Suspense fallback={chartFallback}>
                                <Chart
                                    options={methodCharts.collectedOptions}
                                    series={[methodCharts.collectedCash, methodCharts.collectedUpi]}
                                    type="donut"
                                    height={chartHeight}
                                />
                            </Suspense>
                        ) : (
                            <p className="dashboard-empty">No collected entries yet.</p>
                        )}
                    </div>
                </div>

                <aside className="dashboard-activity">
                    <RecentList
                        title="Recent Expenses"
                        emptyText="No recent expenses"
                        items={recentExpenses}
                        amountClass="text-warning"
                        renderMeta={(expense) => (
                            <span>{formatDate(expense.date || expense.createdAt)}</span>
                        )}
                    />
                    <RecentList
                        title="Recent Collected Cash"
                        emptyText="No recent collected cash"
                        items={recentCollectedCash}
                        amountClass="text-success"
                        renderMeta={(cash) => (
                            <>
                                <span>{String(cash.paymentMethod || 'cash').toUpperCase()}</span>
                                <span>{formatDate(cash.date || cash.collectedDate)}</span>
                            </>
                        )}
                    />
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
