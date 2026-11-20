import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './assets/css/style.css';
import './assets/css/satoshi.css';
import {purgeDemoData, clearAutoPurityStamps} from './utils/purgeDemoData';

purgeDemoData();
clearAutoPurityStamps();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
