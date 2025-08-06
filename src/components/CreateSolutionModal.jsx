import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../api/http';

export default function CreateSolutionModal({ show, onHide, onCreated }) {
    const [name, setName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (show) {
            setName('');
            setYear(new Date().getFullYear());
            setDescription('');
            setError('');
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/solution', { name, year, description });
            onCreated(res.data.solutionCard);
            onHide();
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(err.message || 'Failed to create solution card');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Solution Card</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Solution Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            required
                            minLength={2}
                            maxLength={64}
                            placeholder="e.g. Vinayaka Chavithi 2025"
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Year</Form.Label>
                        <Form.Control
                            type="number"
                            value={year}
                            required
                            min={2000}
                            max={2100}
                            onChange={e => setYear(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={description}
                            maxLength={200}
                            placeholder="Describe this solution card (optional)"
                            onChange={e => setDescription(e.target.value)}
                        />
                    </Form.Group>
                    {error && <div className="text-danger small">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
