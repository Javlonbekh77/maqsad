'use client';

import './snow-effect.css';

export default function SnowEffect() {
    // Create an array of snowflakes to render
    const snowflakes = Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="snowflake"></div>
    ));

    return <div className="snow-container" aria-hidden="true">{snowflakes}</div>;
};
