// src/store/solutionSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/http'; // your axios instance

// Async thunk to fetch all solutions or specific solution by ID
export const fetchSolutions = createAsyncThunk(
    'solutions/fetchSolutions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/solution'); // Adjust endpoint as needed
            return response.data; // assuming response.data is an array of solutions
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch solutions');
        }
    }
);

// Optional: thunk to fetch single solution by ID
export const fetchSolutionById = createAsyncThunk(
    'solutions/fetchSolutionById',
    async (solutionId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/solution/${solutionId}`);
            return response.data; // assuming the solution object
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch solution');
        }
    }
);

const solutionSlice = createSlice({
    name: 'solutions',
    initialState: {
        items: [],         // array of solution objects
        currentSolution: null, // can hold a single solution if needed
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentSolution(state) {
            state.currentSolution = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all solutions
            .addCase(fetchSolutions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSolutions.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchSolutions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch one solution by ID
            .addCase(fetchSolutionById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSolutionById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSolution = action.payload;
            })
            .addCase(fetchSolutionById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentSolution } = solutionSlice.actions;
export default solutionSlice.reducer;
