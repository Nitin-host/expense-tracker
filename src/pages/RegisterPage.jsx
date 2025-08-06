import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Register from '../components/Register';
import { registerUser, resetRegisterSuccess } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const dispatch = useDispatch();
    const { loading, error, registerSuccess } = useSelector(state => state.auth);
    const navigate = useNavigate();

    const handleRegister = async form => {
        const result = await dispatch(registerUser(form));
        if (registerUser.fulfilled.match(result)) {
            setTimeout(() => {
                dispatch(resetRegisterSuccess());
                navigate('/login');
            }, 1500);
        }
    };

    useEffect(() => {
        return () => {
            dispatch(resetRegisterSuccess());
        };
    }, [dispatch]);

    return (
        <Register onRegister={handleRegister} loading={loading} error={error} success={registerSuccess} />
    );
};

export default RegisterPage;
