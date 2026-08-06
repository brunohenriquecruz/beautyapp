import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Beauty App",
  description: "Beauty business management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
