import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route} from "react-router-dom";
import {Amplify} from "aws-amplify";


import './index.css'
import App from './App.jsx'
import awsConfig from './aws-exports';

Amplify.configure(awsConfig);


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* main app */}
        <Route path="/" element={<App />} />
        {/* Cognito redirects here after login */}
        <Route path="/callback" element={<App />}/>
        {/* more to add */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
