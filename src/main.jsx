import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './store';
import { AlertProvider } from './utils/AlertUtil';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <AlertProvider>
            <App />
        </AlertProvider>
    </Provider>
);

