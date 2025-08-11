import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import api from '../api/http';
import { useAlert } from '../utils/AlertUtil';

import SolutionCard from '../components/SolutionCard';
import SolutionModal from '../components/SolutionModal';
import ShareSolutionModal from '../components/ShareSolutionModal';
import noSolutions from '/svg/solution.svg';
import '../styles/solution.scss'

export default function Solution() {
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editSolution, setEditSolution] = useState(null);
    const [shareSolution, setShareSolution] = useState(null);
    const { notifyError } = useAlert();

    const fetchSolutions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/solution');
            if (!Array.isArray(res.data)) {
                setSolutions([]);
                setError('Invalid data received');
                return;
            }
            setSolutions(res.data);
        } catch {
            notifyError('Failed to load solutions');
            setError('Failed to load solutions');
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
            await api.delete(`/solution/${solution._id}`);
            setSolutions((prev) => prev.filter((s) => s._id !== solution._id));
        }
    };

    const handleShare = async (solutionId, shareData) => {
        await api.post(`/solution/${solutionId}/share`, shareData);
    };

    return (
        <Container className="mt-4">
            {loading && <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
            </div>}
            {!loading &&
                <>
                    <Row className="mb-3">
                        <Col><h3>Solutions ({solutions.length})</h3></Col>
                        <Col className="text-end">
                            <Button onClick={() => setShowCreateModal(true)}>Create</Button>
                        </Col>
                    </Row>

                    {error && <div className="alert alert-danger">{error}</div>}

                    {/* NOTE: each Col is a flex container (d-flex) so card can stretch */}
                    <Row xs={1} sm={2} md={3} lg={4} className="g-4 align-items-stretch">
                        {solutions.length === 0 && (
                            <div
                                className="d-flex flex-column align-items-center justify-content-center text-center w-100"
                                style={{ minHeight: '60vh' }}
                            >
                                <img
                                    src={noSolutions}
                                    alt="No Solutions"
                                    style={{ maxWidth: '350px', height: 'auto' }}
                                />
                                <p className="mt-3" style={{ color: 'var(--table-text)' }}>
                                    You don’t have any solutions yet. Start by creating one.
                                </p>
                            </div>
                        )}
                        {solutions.map((solution) => (
                            <Col key={solution._id} className="d-flex">
                                <SolutionCard
                                    solution={solution}
                                    onEdit={setEditSolution}
                                    onDelete={handleDelete}
                                    onShare={setShareSolution}
                                />
                            </Col>
                        ))}
                    </Row>

                    {showCreateModal && (
                        <SolutionModal
                            show={showCreateModal}
                            onHide={() => setShowCreateModal(false)}
                            onSubmit={handleCreate}
                        />
                    )}

                    {editSolution && (
                        <SolutionModal
                            show={Boolean(editSolution)}
                            onHide={() => setEditSolution(null)}
                            onSubmit={handleUpdate}
                            initialData={editSolution}
                        />
                    )}

                    {shareSolution && (
                        <ShareSolutionModal
                            show={Boolean(shareSolution)}
                            onHide={() => setShareSolution(null)}
                            solution={shareSolution}
                            onDone={fetchSolutions}
                            onShare={handleShare}
                        />
                    )}
                </>
            }
        </Container>
    );
}
