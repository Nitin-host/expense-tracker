import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useAlert } from '../utils/AlertUtil';

export default function SolutionModal({ show, onHide, onSubmit, initialData }) {
    const [name, setName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { notifySuccess, notifyError } = useAlert();

    useEffect(() => {
        if (show) {
            setName(initialData?.name || '');
            setYear(initialData?.year || new Date().getFullYear());
            setDescription(initialData?.description || '');
        }
    }, [show, initialData]);

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ name, year, description });
            notifySuccess(initialData ? 'Solution updated successfully' : 'Solution created successfully');
            onHide();
        } catch (err) {
            const apiMessage = err?.response?.data?.error?.message;
            notifyError(apiMessage || 'Failed to save solution');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{initialData ? 'Edit' : 'Create'} Solution</Modal.Title>
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
                    <Form.Group>
                        <Form.Label>Description (optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            maxLength={200}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
