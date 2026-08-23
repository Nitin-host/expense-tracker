import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './store';
import { setTokens } from './store/authSlice';
import { setAuthTokenSync } from './api/http';
import './index.css';

setAuthTokenSync(({ token, refreshToken }) => {
    store.dispatch(setTokens({ token, refreshToken }));
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <App />
    </Provider>
);

