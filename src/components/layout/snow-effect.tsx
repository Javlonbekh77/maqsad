
'use client';

import './snow-effect.css';

export default function SnowEffect() {
    const snowflakes = Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="snowflake"></div>
    ));
    return <div className="snow-container">{snowflakes}</div>;
};
