import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaUserPlus } from 'react-icons/fa';

export default function SolutionCard({ solution, onEdit, onDelete, onShare, theme = 'light' }) {
    const cardClass = theme === 'dark' ? 'dark' : 'light';

    return (
        <Card className={`solution-card ${cardClass} shadow-sm border-0`}>
            <Card.Header className="d-flex justify-content-between align-items-start p-3">
                <div>
                    <Card.Title as="h5">{solution.name}</Card.Title>
                    <div className="text-muted small">{solution.year}</div>
                </div>
                <Button variant="link" onClick={() => onShare(solution)} title="Share">
                    <FaUserPlus />
                </Button>
            </Card.Header>
            <Card.Body>
                <div style={{ minHeight: '2em' }}>{solution.description || <em>No description</em>}</div>
                <div className="d-flex mt-3 gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => onEdit(solution)}>
                        <FaEdit /> Edit
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => onDelete(solution)}>
                        <FaTrashAlt /> Delete
                    </Button>
                </div>
            </Card.Body>
            <Card.Footer className="py-2 d-flex justify-content-between align-items-center">
                <a href={`/solution/${solution._id}/dashboard`}>Explore &raquo;</a>
            </Card.Footer>
        </Card>
    );
}
