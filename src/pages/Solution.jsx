import React, { useEffect, useState } from 'react';
import { Container, Button, Alert } from '../components/ui';
import api from '../api/http';
import { useAlert } from '../context/alertContext';
import SolutionCard from '../components/SolutionCard';
import SolutionModal from '../components/SolutionModal';
import ShareSolutionModal from '../components/ShareSolutionModal';
import { SkeletonSolutionsPage } from '../components/Skeleton';
import noSolutions from '/svg/solution.svg';

export default function Solution() {
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editSolution, setEditSolution] = useState(null);
    const [shareSolution, setShareSolution] = useState(null);
    const { notifySuccess, notifyError } = useAlert();

    const fetchSolutions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/solution', { params: { page: 1, limit: 50 } });
            const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
            setSolutions(list);
        } catch (err) {
            const apiMessage = err?.response?.data?.error?.message;
            const finalMessage = apiMessage || 'Failed to load solutions';
            notifyError(finalMessage);
            setError(finalMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolutions();
    }, []);

    const handleCreate = async (data) => {
        const res = await api.post('/solution', data);
        if (res.data?.solutionCard) {
            setSolutions((prev) => [res.data.solutionCard, ...prev]);
            setShowCreateModal(false);
        }
    };

    const handleUpdate = async (data) => {
        const res = await api.put(`/solution/${editSolution._id}`, data);
        if (res.data?.solutionCard) {
            setSolutions((prev) =>
                prev.map((s) => (s._id === editSolution._id ? res.data.solutionCard : s))
            );
            setEditSolution(null);
        }
    };

    const handleDelete = async (solution) => {
        if (window.confirm(`Delete "${solution.name}"?`)) {
            try {
                await api.delete(`/solution/${solution._id}`);
                setSolutions((prev) => prev.filter((s) => s._id !== solution._id));
                notifySuccess(`Solution "${solution.name}" deleted successfully`);
            } catch (err) {
                const apiMessage = err?.response?.data?.error?.message;
                const finalMessage = apiMessage || `Failed to delete "${solution.name}"`;
                notifyError(finalMessage);
            }
        }
    };

    const handleShare = async (solutionId, shareData) => {
        await api.post(`/solution/${solutionId}/share`, shareData);
    };

    const subtitle =
        solutions.length === 0
            ? 'Create your first shared budget space.'
            : `${solutions.length} active ${solutions.length === 1 ? 'solution' : 'solutions'}`;

    if (loading) {
        return <SkeletonSolutionsPage />;
    }

    return (
        <Container className="page-shell max-w-[1200px] py-2">
            <div className="page-header">
                <div>
                    <h1 className="page-heading">Solutions</h1>
                    <p className="page-sub">{subtitle}</p>
                </div>
                <Button className="touch-btn" onClick={() => setShowCreateModal(true)}>
                    Create
                </Button>
            </div>

            {error ? <Alert variant="danger" className="mb-3">{error}</Alert> : null}

            {solutions.length === 0 ? (
                <div className="empty-state page-surface">
                    <img src={noSolutions} alt="" />
                    <p>No solutions yet. Start with one for a trip, event, or shared budget.</p>
                    <Button className="touch-btn" onClick={() => setShowCreateModal(true)}>
                        Create solution
                    </Button>
                </div>
            ) : (
                <div className="solution-grid">
                    {solutions.map((solution) => (
                        <SolutionCard
                            key={solution._id}
                            solution={solution}
                            onEdit={setEditSolution}
                            onDelete={handleDelete}
                            onShare={setShareSolution}
                        />
                    ))}
                </div>
            )}

            {showCreateModal ? (
                <SolutionModal
                    show={showCreateModal}
                    onHide={() => setShowCreateModal(false)}
                    onSubmit={handleCreate}
                />
            ) : null}

            {editSolution ? (
                <SolutionModal
                    show
                    onHide={() => setEditSolution(null)}
                    onSubmit={handleUpdate}
                    initialData={editSolution}
                />
            ) : null}

            {shareSolution ? (
                <ShareSolutionModal
                    show
                    onHide={() => setShareSolution(null)}
                    solution={shareSolution}
                    onDone={fetchSolutions}
                    onShare={handleShare}
                />
            ) : null}
        </Container>
    );
}
