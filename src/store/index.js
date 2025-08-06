import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import solutionReducer from './solutionSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        solutions: solutionReducer,
    },
});

export default store;
