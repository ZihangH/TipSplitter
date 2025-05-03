import type { Metadata } from 'next';
// Removed Geist font imports
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

// Removed Geist font variables

export const metadata: Metadata = {
  title: 'TipSplitter', // Updated title
  description: 'Calculate tips and split bills easily.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Removed font variables from className */}
      <body className="antialiased">
        {children}
        <Toaster /> {/* Add Toaster for notifications */}
      </body>
    </html>
  );
}
