import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Login from '../components/Login';
import { loginUser } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const dispatch = useDispatch();
    const { loading, error, isAuthenticated } = useSelector(state => state.auth);
    const navigate = useNavigate();

    const handleLogin = async credentials => {
        const result = await dispatch(loginUser(credentials));
        if (loginUser.fulfilled.match(result)) {
            navigate('/home'); // dashboard or home
        }
    };

    return <Login onLogin={handleLogin} loading={loading} error={error} />;
};

export default LoginPage;
