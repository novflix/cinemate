import React from 'react';
import 'flag-icons/css/flag-icons.min.css';
import ReactDOM from 'react-dom/client';
import './i18n'; // must be imported before App to initialise i18next
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);