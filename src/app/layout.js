import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Poiss'Caille",
  description: "Boutique de matériel de pêche en eau douce",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="inter.variable">
      <body>{children}</body>
    </html>
  );
}
