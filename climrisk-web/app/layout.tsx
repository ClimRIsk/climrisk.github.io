import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: {
    default: "ClimRisk · Quantitative Climate Risk Advisory",
    template: "%s · ClimRisk",
  },
  description:
    "A quantitative advisory firm translating peer-reviewed climate science into asset-level financial exposure — Capital-at-Risk, EBITDA compression, and audit-ready disclosure under IFRS S2, TCFD, and CSRD.",
  keywords: [
    "climate risk advisory",
    "climate financial risk",
    "TCFD",
    "CSRD",
    "IFRS S2",
    "physical risk",
    "transition risk",
    "NGFS scenarios",
    "climate stress testing",
    "carbon auditing",
  ],
  openGraph: {
    type: "website",
    siteName: "ClimRisk",
    title: "ClimRisk · Quantitative Climate Risk Advisory",
    description:
      "Asset-level climate risk quantification and advisory for banks, asset managers, and industrial companies.",
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
      <body className="antialiased bg-[#0A0B0E] text-zinc-100 min-h-screen">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
