import React, { useEffect, useState } from 'react';
import ExpenseTable from '../pages/ExpenseTable';
import api from '../api/http';
import { useParams } from 'react-router-dom';

function ExpenseTableContainer({ onEdit, onDelete }) {
    const { id: solutionCardId } = useParams();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchExpenses() {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/expense/solution-card/${solutionCardId}`);
                setExpenses(res.data.expenses);
            } catch (err) {
                setError('Failed to load expenses');
            } finally {
                setLoading(false);
            }
        }

        if (solutionCardId) {
            fetchExpenses();
        }
    }, [solutionCardId]);

    if (loading) return <p>Loading expenses...</p>;
    if (error) return <p className="text-danger">{error}</p>;

    return (
        <ExpenseTable expenses={expenses} onEdit={onEdit} onDelete={onDelete} />
    );
}

export default ExpenseTableContainer;
