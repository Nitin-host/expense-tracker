import React from 'react';
import { Table, Button, Card } from 'react-bootstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

// Helper to detect mobile view
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

function MobileExpenseCard({ exp, onEdit, onDelete }) {
    const totalPaid = exp.payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const pending = exp.amount - totalPaid;

    return (
        <Card
            className="mb-3"
            style={{
                borderLeft: `6px solid ${pending > 0 ? '#f39c12' : '#27ae60'}`, // orange if pending, green if all paid
                paddingLeft: '12px',
            }}
        >
            <Card.Body>
                <Card.Title>{exp.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{new Date(exp.createdAt).toLocaleDateString()}</Card.Subtitle>
                <div><strong>Category:</strong> {exp.category}</div>
                <div><strong>Amount:</strong> ₹{exp.amount.toFixed(2)}</div>
                <div><strong style={{ color: '#27ae60' }}>Paid:</strong> <span style={{ color: '#27ae60' }}>₹{totalPaid.toFixed(2)}</span></div>
                <div><strong style={{ color: '#f39c12' }}>Pending:</strong> <span style={{ color: '#f39c12' }}>₹{pending.toFixed(2)}</span></div>
                <div><strong>Paid By:</strong> {exp.paidBy?.name || 'N/A'}</div>
                <div className="mt-3 d-flex gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => onEdit(exp)}><FaEdit /> Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => onDelete(exp)}><FaTrashAlt /> Delete</Button>
                </div>
            </Card.Body>
        </Card>
    );
}

function ExpenseTable({ expenses, onEdit, onDelete }) {
    const [mobileView, setMobileView] = React.useState(isMobile());

    React.useEffect(() => {
        function handleResize() {
            setMobileView(isMobile());
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (mobileView) {
        return (
            <div>
                {expenses?.length === 0 ? (
                    <div className="text-center my-3">No expenses found.</div>
                ) : (
                    expenses.map(exp => (
                        <MobileExpenseCard key={exp._id} exp={exp} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>
        );
    }

    // Desktop/table view with colored amounts
    return (
        <Table striped bordered hover size="sm" responsive>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Paid By</th>
                    <th>Created At</th>
                    <th style={{ width: '120px' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {expenses?.length === 0 ? (
                    <tr>
                        <td colSpan="8" className="text-center">No expenses found.</td>
                    </tr>
                ) : (
                    expenses?.map((exp) => {
                        const totalPaid = exp.payments.reduce((sum, p) => sum + p.paidAmount, 0);
                        const pending = exp.amount - totalPaid;

                        return (
                            <tr key={exp._id}>
                                <td>{exp.name}</td>
                                <td>{exp.category}</td>
                                <td>₹{exp.amount.toFixed(2)}</td>
                                <td style={{ color: '#27ae60', fontWeight: 'bold' }}>₹{totalPaid.toFixed(2)}</td>
                                <td style={{ color: '#f39c12', fontWeight: 'bold' }}>{pending.toFixed(2)}</td>
                                <td>{exp.paidBy?.name || 'N/A'}</td>
                                <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        title="Edit"
                                        onClick={() => onEdit(exp)}
                                    >
                                        <FaEdit />
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        title="Delete"
                                        onClick={() => onDelete(exp)}
                                    >
                                        <FaTrashAlt />
                                    </Button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </Table>
    );
}

export default ExpenseTable;
