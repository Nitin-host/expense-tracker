import React from 'react';
import '../styles/BackgroundWrapper.scss'
const BackgroundWrapper = ({ children }) => (
    <div className="auth-bg-wrapper">
        {children}
    </div>
);

export default BackgroundWrapper;
