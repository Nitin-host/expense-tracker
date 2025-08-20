// src/store/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/http';

// Utility functions for localStorage persistence
const saveAuthToLocal = (authState) => {
    try {
        localStorage.setItem('auth', JSON.stringify(authState));
    } catch (e) {
        console.error('Failed to save auth data to localStorage:', e);
    }
};

const getAuthFromLocal = () => {
    try {
        const serializedState = localStorage.getItem('auth');
        if (serializedState === null) return null;
        return JSON.parse(serializedState);
    } catch (e) {
        console.error('Failed to load auth data from localStorage:', e);
        return null;
    }
};

const clearAuthFromLocal = () => {
    try {
        localStorage.removeItem('auth');
    } catch (e) {
        console.error('Failed to clear auth data from localStorage:', e);
    }
};

// Async login thunk
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await api.post('/login', { email, password });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error?.message || 'Login failed');
        }
    }
);

// Async register thunk
export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async ({ name, email, password }, { rejectWithValue }) => {
        try {
            const res = await api.post('/create', { name, email, password });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error?.message || 'Registration failed');
        }
    }
);

// Load persisted auth state from localStorage to hydrate Redux state
const persistedAuth = getAuthFromLocal();

const authSlice = createSlice({
    name: 'auth',
    initialState: persistedAuth || {
        user: null,
        token: null,
        refreshToken: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        registerSuccess: false,
    },
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = null;
            state.registerSuccess = false;

            clearAuthFromLocal();
        },
        resetRegisterSuccess(state) {
            state.registerSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.isAuthenticated = false;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.refreshToken = action.payload.refreshToken;
                state.isAuthenticated = true;
                state.error = null;

                // Save auth state to localStorage
                saveAuthToLocal({
                    user: state.user,
                    token: state.token,
                    refreshToken: state.refreshToken,
                    isAuthenticated: state.isAuthenticated,
                });
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Login failed';
                state.isAuthenticated = false;
            })

            // Register cases
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.registerSuccess = false;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
                state.registerSuccess = true;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Registration failed';
                state.registerSuccess = false;
            });
    },
});

export const { logout, resetRegisterSuccess } = authSlice.actions;

export default authSlice.reducer;
