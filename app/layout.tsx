import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMAG Polomolok Agricultural Resource Distribution & Production Analytics",
  description:
    "Official management system for the Office of the Municipal Agriculturist (OMAG), Municipality of Polomolok, South Cotabato. Supporting RSBSA registration, parcel georeferencing, photo metadata verification, crop loss monitoring, and FIFO inventory distribution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
