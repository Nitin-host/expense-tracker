import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './store';
import { setTokens } from './store/authSlice';
import { setAuthTokenSync } from './api/http';
import { clearChunkReloadFlag } from './utils/lazyWithRetry';
import './index.css';

setAuthTokenSync(({ token, refreshToken }) => {
    store.dispatch(setTokens({ token, refreshToken }));
});

clearChunkReloadFlag();

window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <App />
    </Provider>
);

