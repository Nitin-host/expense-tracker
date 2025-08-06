import React, { useEffect, useState } from 'react';
import {
    Container, Row, Col, Button, Modal, Form,
    Spinner
} from 'react-bootstrap';
import api from '../api/http';  // your axios instance
import { useAlert } from '../utils/AlertUtil';
import TableUtil from '../utils/TableUtil';
import { RiUserSettingsLine } from 'react-icons/ri';

const roles = ['user', 'admin', 'super_admin'];

const CreateUserBySuperAdmin = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // State for role change modal
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    const { notifySuccess, notifyError } = useAlert();

    const [form, setForm] = useState({ name: '', email: '', role: 'user' });

    // Fetch created users
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/my-created-users');
            setUsers(res.data);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Failed to fetch users');
        }
        setLoadingUsers(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Create user form handlers
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/create-by-super-admin', form);
            notifySuccess('User created successfully. Temporary password email sent.');
            setShowModal(false);
            setForm({ name: '', email: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Failed to create user');
        }
        setCreating(false);
    };

    // Open role modal and initialize role select
    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    // Submit role change
    const submitRoleChange = async () => {
        if (!selectedUser) return;
        try {
            await api.put('/change-user-role', {
                userId: selectedUser._id,
                newRole,
            });
            // Update user list locally
            setUsers((prev) =>
                prev.map((u) => (u._id === selectedUser._id ? { ...u, role: newRole } : u))
            );
            notifySuccess('User role updated successfully');
            setShowRoleModal(false);
        } catch (err) {
            notifyError(err.response?.data?.message || 'Failed to update user role');
        }
    };

    // Table columns
    const tableHeader = [
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Role', key: 'role' },
        { label: 'Created At', key: 'createdAt', dataFormat: 'date' },
    ];

    // Action button for opening role modal
    const tableActions = [
        {
            btnTitle: 'Change Role',
            btnClass: 'btn-link p-0',
            btnAction: openRoleModal,
            iconComponent: RiUserSettingsLine,
            isVisible: () => true,
        },
    ];

    return (
        <Container className="my-4">
            <Row className="mb-3 align-items-center">
                <Col className="text-start">
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        Create New User
                    </Button>
                </Col>
            </Row>

            {loadingUsers ? (
                <div className="text-center my-5">
                    <Spinner animation="border" />
                </div>
            ) : (
                <TableUtil
                    tableName="Users You Created"
                    tableData={users}
                    tableHeader={tableHeader}
                    tableActions={tableActions}
                    searchKeys={['name', 'email', 'role']}
                    filters={{}}
                    setFilters={() => { }}
                    getCardBorderColor={(user) =>
                        user.role === 'super_admin' ? '#0d6efd' : '#6c757d'
                    }
                />
            )}

            {/* Create User Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Create User</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="name" className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter name"
                                required
                                autoComplete="off"
                            />
                        </Form.Group>

                        <Form.Group controlId="email" className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter email"
                                required
                                autoComplete="off"
                            />
                        </Form.Group>

                        <Form.Group controlId="role" className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                required
                            >
                                {roles.map((r) => (
                                    <option key={r} value={r}>
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={creating}>
                            {creating ? 'Creating...' : 'Create User'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Change Role Modal */}
            <Modal
                show={showRoleModal}
                onHide={() => setShowRoleModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Change User Role</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="changeRoleSelect">
                        <Form.Label>Select New Role</Form.Label>
                        <Form.Select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            {roles.map((r) => (
                                <option key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowRoleModal(false)}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={submitRoleChange}
                        disabled={!newRole || creating}
                    >
                        {creating ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CreateUserBySuperAdmin;
