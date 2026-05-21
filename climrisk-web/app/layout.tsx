import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: {
    default: "ClimRisk · Climate Financial Risk Intelligence",
    template: "%s · ClimRisk",
  },
  description:
    "Quantify physical risk, transition risk, and financial exposure across your portfolio. Asset by asset. Scenario by scenario. NGFS Phase 4 · IPCC AR6 · CSRD ready.",
  keywords: [
    "climate risk",
    "climate financial risk",
    "TCFD",
    "CSRD",
    "IFRS S2",
    "physical risk",
    "transition risk",
    "NGFS scenarios",
    "climate stress testing",
  ],
  openGraph: {
    type: "website",
    siteName: "ClimRisk",
    title: "ClimRisk · Climate Financial Risk Intelligence",
    description:
      "Asset-level climate risk quantification for banks, asset managers, and industrial companies.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#060f1e] text-slate-100 min-h-screen">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
