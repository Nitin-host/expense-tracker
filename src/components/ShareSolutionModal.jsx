import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import api from '../api/http';
import { useAlert } from '../utils/AlertUtil';

const ROLE_OPTIONS = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
];

// Avatar helper
const getInitials = (name) =>
    name
        ? name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
        : '';

const Avatar = ({ name }) => (
    <span
        style={{
            display: 'inline-block',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#e0e7ef',
            color: '#222',
            lineHeight: '32px',
            textAlign: 'center',
            fontWeight: 'bold',
            marginRight: 10,
            userSelect: 'none',
        }}
    >
        {getInitials(name)}
    </span>
);

export default function ShareSolutionModal({ show, onHide, solution, onDone, onShare }) {
    const { notifySuccess, notifyError } = useAlert();
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [sharedUsers, setSharedUsers] = useState([]);
    const [notify, setNotify] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!show) return;

        api.get(`/users/available-to-share?solutionCardId=${solution._id}`)
            .then(({ data }) => {
                setAllUsers(
                    data.map((u) => ({
                        value: u._id,
                        label: u.name,
                        email: u.email,
                    }))
                );
            })
            .catch(() => setAllUsers([]));

        if (solution) setSharedUsers(solution.sharedWith || []);
        setSelectedUsers([]);
        setNotify(false);
    }, [show, solution]);

    const onUserSelectChange = (list) => {
        setSelectedUsers(
            list.map((opt) => ({
                ...opt,
                role: selectedUsers.find((u) => u.value === opt.value)?.role || 'viewer',
            }))
        );
    };

    const onRoleChange = (userId, newRole, isSelectedUser) => {
        if (isSelectedUser) {
            setSelectedUsers(selectedUsers.map((u) => (u.value === userId ? { ...u, role: newRole } : u)));
        } else {
            setSharedUsers(sharedUsers.map((u) => (u.user === userId ? { ...u, role: newRole } : u)));
        }
    };

    const onUnshare = (userId) => {
        setSharedUsers(sharedUsers.filter((u) => u.user !== userId));
    };

    const onSave = async () => {
        if (!solution) return;
        setSaving(true);
        try {
            const owners = sharedUsers.filter((u) => u.role === 'owner');
            const newShares = [
                ...selectedUsers.map((u) => ({ user: u.value, role: u.role })),
                ...sharedUsers.filter((u) => !owners.some((o) => o.user === u.user) && u.role !== 'owner'),
            ];

            await onShare(solution._id, {
                sharedWith: [...owners, ...newShares],
                notifyUsers: notify,
            });

            notifySuccess('Sharing updated successfully!');
            setSaving(false);
            onDone && onDone();
            onHide();
        } catch {
            setSaving(false);
            notifyError('Failed to update sharing');
        }
    };

    const formatOptionLabel = ({ label, email }) => (
        <div className="d-flex align-items-center">
            <Avatar name={label} />
            <div>
                <div className="fw-bold">{label}</div>
                <small className="text-muted">{email}</small>
            </div>
        </div>
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>Share ({solution?.name})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Select
                        isMulti
                        value={selectedUsers}
                        options={allUsers}
                        onChange={onUserSelectChange}
                        classNamePrefix="react-select"
                        placeholder="Select users to share with..."
                        formatOptionLabel={formatOptionLabel}
                    />
                </Form.Group>

                {selectedUsers.length > 0 && (
                    <>
                        <strong>Selected Users ({selectedUsers.length})</strong>
                        {selectedUsers.map((u) => (
                            <Row key={u.value} className="align-items-center justify-content-between p-2 border-bottom">
                                <Col xs="auto" className="d-flex align-items-center">
                                    <Avatar name={u.label} />
                                    <div>
                                        <div>{u.label}</div>
                                        <small className="text-muted">{u.email}</small>
                                    </div>
                                </Col>
                                <Col xs="auto" className="d-flex align-items-center gap-2">
                                    <Form.Select
                                        size="sm"
                                        value={u.role}
                                        style={{ width: 110 }}
                                        onChange={(e) => onRoleChange(u.value, e.target.value, true)}
                                    >
                                        {ROLE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="ms-2 text-danger"
                                        onClick={() => setSelectedUsers(selectedUsers.filter((su) => su.value !== u.value))}
                                    >
                                        &times;
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                    </>
                )}

                <Form.Group className="my-3">
                    <Form.Check
                        type="checkbox"
                        label="Notify Users"
                        checked={notify}
                        onChange={(e) => setNotify(e.target.checked)}
                    />
                </Form.Group>

                {sharedUsers.length > 0 && (
                    <>
                        <strong>Shared Users ({sharedUsers.length})</strong>
                        {sharedUsers.map((u) => (
                            <Row key={u.user} className="align-items-center justify-content-between p-2 border-bottom">
                                <Col xs="auto" className="d-flex align-items-center">
                                    <Avatar name={u.name || 'User'} />
                                    <div>
                                        <div>{u.name}</div>
                                        <small className="text-muted">{u.email}</small>
                                    </div>
                                </Col>
                                <Col xs="auto" className="d-flex align-items-center gap-2">
                                    <strong>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</strong>
                                    {u.role !== 'owner' && (
                                        <>
                                            <Form.Select
                                                size="sm"
                                                value={u.role}
                                                style={{ width: 110 }}
                                                onChange={(e) => onRoleChange(u.user, e.target.value, false)}
                                            >
                                                {ROLE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="ms-2 text-danger"
                                                onClick={() => onUnshare(u.user)}
                                            >
                                                &times;
                                            </Button>
                                        </>
                                    )}
                                    {u.role === 'owner' && <span className="badge bg-secondary ms-2">Owner</span>}
                                </Col>
                            </Row>
                        ))}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={saving}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Done'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
