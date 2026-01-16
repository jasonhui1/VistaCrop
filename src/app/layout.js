import '../index.css';

export const metadata = {
    title: 'Art Detail Studio',
    description: 'Image cropping and composition tool',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                <div id="root">{children}</div>
            </body>
        </html>
    );
}
