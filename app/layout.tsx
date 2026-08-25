import type { Metadata, Viewport } from "next";
import "@/styles.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Fresh15 Partner — Deliver Fresh, Earn More",
  description: "The Fresh15 Delivery Partner app — accept orders, track earnings, and grow with India's fastest grocery network.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Fresh15 Partner — Deliver Fresh, Earn More",
    description: "The Fresh15 Delivery Partner app — accept orders, track earnings, and grow with India's fastest grocery network.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresh15 Partner — Deliver Fresh, Earn More",
    description: "The Fresh15 Delivery Partner app — accept orders, track earnings, and grow with India's fastest grocery network.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3d8b5c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
