import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from './ui';
import Select from 'react-select';
import { FaTimes } from 'react-icons/fa';
import api from '../api/http';
import { useAlert } from '../context/alertContext';

const ROLE_OPTIONS = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
];

const normalizeUserId = (value) => {
    if (value == null) return null;
    if (typeof value === 'object' && value._id != null) return String(value._id);
    return String(value);
};

const getInitials = (name) =>
    name
        ? name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '?';

function ShareAvatar({ name }) {
    return <span className="share-user-avatar">{getInitials(name)}</span>;
}

function ShareUserRow({ name, email, children }) {
    return (
        <div className="share-user-row">
            <div className="share-user-row__info">
                <ShareAvatar name={name} />
                <div className="share-user-row__text">
                    <div className="share-user-row__name">{name}</div>
                    <div className="share-user-row__email">{email}</div>
                </div>
            </div>
            <div className="share-user-row__actions">{children}</div>
        </div>
    );
}

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
            .catch((err) => {
                const apiMessage = err?.response?.data?.error?.message;
                notifyError(apiMessage || 'Failed to load available users');
                setAllUsers([]);
            });

        if (solution) {
            const ownerEntry = {
                user: solution.owner._id,
                name: solution.owner.name,
                email: solution.owner.email,
                role: 'owner',
            };

            setSharedUsers([ownerEntry, ...(solution.sharedWith || [])]);
        }

        setSelectedUsers([]);
        setNotify(false);
    }, [show, solution, notifyError]);

    const onUserSelectChange = (list) => {
        setSelectedUsers(
            (list || []).map((opt) => ({
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
            const validShares = [
                ...selectedUsers.map((u) => ({ user: u.value, role: u.role })),
                ...sharedUsers
                    .filter((u) => u.role !== 'owner')
                    .map((u) => ({ user: normalizeUserId(u.user), role: u.role })),
            ];

            const result = await onShare(solution._id, {
                sharedWith: validShares,
                notifyUsers: notify,
                notifyUserIds: notify ? selectedUsers.map((u) => u.value) : [],
            });

            if (notify) {
                const sent = result?.emailsSent ?? 0;
                const failed = result?.emailErrors?.length ?? 0;
                if (sent > 0 && failed === 0) {
                    notifySuccess(
                        sent === 1
                            ? 'Sharing updated and notification email sent.'
                            : `Sharing updated and ${sent} notification emails sent.`
                    );
                } else if (sent > 0 && failed > 0) {
                    notifySuccess(`Sharing updated. ${sent} email(s) sent, ${failed} failed.`);
                } else if (failed > 0) {
                    notifyError('Sharing updated but notification emails failed to send.');
                } else {
                    notifySuccess('Sharing updated. Select users above to send notification emails.');
                }
            } else {
                notifySuccess('Sharing updated successfully!');
            }
            onDone && onDone();
            onHide();
        } catch (err) {
            const apiMessage = err?.response?.data?.error?.message;
            notifyError(apiMessage || 'Failed to update sharing');
        } finally {
            setSaving(false);
        }
    };

    const formatOptionLabel = ({ label, email }, { context }) => {
        if (context === 'value') {
            return (
                <span className="react-select-chip">
                    <span className="react-select-chip__name">{label}</span>
                    {email ? <span className="react-select-chip__email">{email}</span> : null}
                </span>
            );
        }

        return (
            <div className="share-select-option">
                <ShareAvatar name={label} />
                <div>
                    <div className="share-select-option__name">{label}</div>
                    <div className="share-select-option__email">{email}</div>
                </div>
            </div>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered fullscreen="sm-down">
            <Modal.Header closeButton>
                <Modal.Title>Share ({solution?.name})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Add people</Form.Label>
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
                    <section className="share-user-list mb-3">
                        <h4 className="share-user-list__title">
                            Selected users ({selectedUsers.length})
                        </h4>
                        <div className="share-user-list__body">
                            {selectedUsers.map((u) => (
                                <ShareUserRow key={u.value} name={u.label} email={u.email}>
                                    <Form.Select
                                        size="sm"
                                        value={u.role}
                                        aria-label={`Role for ${u.label}`}
                                        onChange={(e) => onRoleChange(u.value, e.target.value, true)}
                                    >
                                        {ROLE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <button
                                        type="button"
                                        className="share-user-row__remove"
                                        onClick={() =>
                                            setSelectedUsers(selectedUsers.filter((su) => su.value !== u.value))
                                        }
                                        aria-label={`Remove ${u.label}`}
                                    >
                                        <FaTimes />
                                    </button>
                                </ShareUserRow>
                            ))}
                        </div>
                    </section>
                )}

                <Form.Group className="mb-3">
                    <Form.Check
                        type="checkbox"
                        label="Notify users by email"
                        checked={notify}
                        onChange={(e) => setNotify(e.target.checked)}
                    />
                </Form.Group>

                {sharedUsers.length > 0 && (
                    <section className="share-user-list">
                        <h4 className="share-user-list__title">
                            People with access ({sharedUsers.length})
                        </h4>
                        <div className="share-user-list__body">
                            {sharedUsers.map((u) => (
                                <ShareUserRow key={u.user} name={u.name || 'User'} email={u.email}>
                                    {u.role === 'owner' ? (
                                        <span className="share-role-badge share-role-badge--owner">Owner</span>
                                    ) : (
                                        <>
                                            <Form.Select
                                                size="sm"
                                                value={u.role}
                                                aria-label={`Role for ${u.name}`}
                                                onChange={(e) => onRoleChange(u.user, e.target.value, false)}
                                            >
                                                {ROLE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <button
                                                type="button"
                                                className="share-user-row__remove"
                                                onClick={() => onUnshare(u.user)}
                                                aria-label={`Remove ${u.name}`}
                                            >
                                                <FaTimes />
                                            </button>
                                        </>
                                    )}
                                </ShareUserRow>
                            ))}
                        </div>
                    </section>
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
