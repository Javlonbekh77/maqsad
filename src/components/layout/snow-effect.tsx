'use client';

import './snow-effect.css';

export default function SnowEffect() {
    const snowflakes = Array.from({ length: 25 }).map((_, i) => (
        <div key={`dot-${i}`} className="snowflake"></div>
    ));
    const fractalSnowflakes = Array.from({ length: 10 }).map((_, i) => (
        <div key={`fractal-${i}`} className="snowflake fractal">
             <div></div>
             <div></div>
        </div>
    ));
    return <div className="snow-container">{snowflakes}{fractalSnowflakes}</div>;
};
