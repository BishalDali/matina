import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'MATINA CLOTHING — Culture on Wear | Nepali Cultural Streetwear',
  description:
    "Contemporary streetwear inspired by Nepal's living heritage. Shop heavyweight tees, hoodies, and limited cultural drops with Cash on Delivery across Nepal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col bg-ivory font-sans text-charcoal antialiased">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
