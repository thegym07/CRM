import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE GYM — CRM Prospects",
  description: "CRM interne THE GYM Ardèche",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full antialiased" style={{ backgroundColor: '#111111', color: 'white' }}>
        {children}
      </body>
    </html>
  );
}
