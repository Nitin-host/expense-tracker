import React, { useEffect, useState } from 'react';
import {
    Container, Row, Col, Button, Modal, Form,
} from '../components/ui';
import api from '../api/http';  // your axios instance
import { useAlert } from '../context/alertContext';
import TableUtil from '../utils/TableUtil';
import { SkeletonUsersPage } from '../components/Skeleton';
import { RiUserSettingsLine, RiDeleteBin6Line } from 'react-icons/ri';

const roles = ['user', 'admin'];

const CreateUserBySuperAdmin = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // State for role change modal
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);


    const { notifySuccess, notifyError } = useAlert();

    const [form, setForm] = useState({ name: '', email: '', role: 'user' });

    // Fetch created users
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/my-created-users?limit=100');
            setUsers(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch (err) {
            notifyError(err.response?.data?.error?.message || 'Failed to fetch users');
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
            const res = await api.post('/create-by-super-admin', form);
            notifySuccess(res.data?.message || 'User created successfully.');
            setForm({ name: '', email: '', role: 'user' });
            setShowModal(false);
            await fetchUsers();
        } catch (err) {
            notifyError(err.response?.data?.error?.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    // Open role modal and initialize role select
    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setDeleting(true);
        try {
            await api.delete(`/user/${userToDelete._id}`);
            notifySuccess('User deleted successfully');
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers(); // Refresh user list
        } catch (err) {
            notifyError(err.response?.data?.error?.message || 'Failed to delete user');
        }
        setDeleting(false);
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
            notifyError(err.response?.data?.error?.message || 'Failed to update user role');
        }
    };

    // Table columns
    const tableHeader = [
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Role', key: 'role', mobileBadge: true },
        { label: 'Joined', key: 'createdAt', dataFormat: 'date' },
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
        {
            btnTitle: 'Delete',
            btnClass: 'btn-link p-0 text-danger',
            btnAction: (user) => openDeleteModal(user),
            iconComponent: RiDeleteBin6Line,
            isVisible: (user) => user.role !== 'super_admin', // Optional: prevent deleting super admins if you want
        },
    ];

    if (loadingUsers) {
        return <SkeletonUsersPage />;
    }

    return (
        <Container className="page-shell my-2">
            <div className="page-header">
                <div>
                    <h1 className="page-heading">Users</h1>
                    <p className="page-sub">Create and manage accounts you own.</p>
                </div>
                <Button variant="primary" className="touch-btn" onClick={() => setShowModal(true)}>
                    Create user
                </Button>
            </div>

            <TableUtil
                tableName="Your users"
                tableData={users}
                tableHeader={tableHeader}
                tableActions={tableActions}
                searchKeys={['name', 'email', 'role']}
                filters={{}}
                setFilters={() => { }}
                getCardBorderColor={(user) =>
                    user.role === 'super_admin' ? '#0f766e' : '#64748b'
                }
            />

            {/* Create User Modal */}
            <Modal
                show={showModal}
                onHide={() => !creating && setShowModal(false)}
                centered
                backdrop={creating ? 'static' : true}
                keyboard={!creating}
            >
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
                                placeholder="Full name"
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
                                placeholder="user@example.com"
                                required
                                autoComplete="off"
                            />
                        </Form.Group>

                        <Form.Group controlId="role" className="mb-0">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                required
                                aria-label="Select user role"
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
                            aria-label="Select new role"
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
            {/* Delete Confirmation Modal */}
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {userToDelete ? (
                        <p>
                            Are you sure you want to delete user <strong>{userToDelete.name}</strong>?
                            This action cannot be undone.
                        </p>
                    ) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDeleteUser}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CreateUserBySuperAdmin;
