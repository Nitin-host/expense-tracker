import React, { useState } from 'react';

const positionClasses = {
    top: 'bottom-[120%] left-1/2 -translate-x-1/2',
    bottom: 'top-[120%] left-1/2 -translate-x-1/2',
    left: 'right-[120%] top-1/2 -translate-y-1/2',
    right: 'left-[120%] top-1/2 -translate-y-1/2',
};

const CustomTooltip = ({ children, content, position = 'top' }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div
                    className={`absolute z-[999] animate-[fadeIn_0.2s_forwards] whitespace-nowrap rounded bg-black/85 px-2 py-[5px] text-xs text-white opacity-0 ${
                        positionClasses[position] || positionClasses.top
                    }`}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

export default CustomTooltip;
