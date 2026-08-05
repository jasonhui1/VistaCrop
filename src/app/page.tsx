'use client';

import dynamic from 'next/dynamic';

// Dynamically import App to avoid SSR issues with canvas/window if any
const App = dynamic(() => import('../App'), { ssr: false });

export default function Page() {
    return <App />;
}
