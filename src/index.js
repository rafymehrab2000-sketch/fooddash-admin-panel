import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "https://b82e00238a5491d0ac960e13eb638690@o4511781218287616.ingest.de.sentry.io/4511781340577872",
  tracesSampleRate: 1.0,
});
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
