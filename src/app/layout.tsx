import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fakumoya Bakery | We are breadwinners',
  description: 'Fresh bread and bakery favourites from Fakumoya Bakery in Seshego.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-ZA"><body><header className="site-header"><a className="logo" href="/">Fakumoya <span>Bakery</span></a><nav><a href="/shop">Shop</a><a href="/subscription">Bread plan</a><a href="/about">Our story</a><a className="cart" href="/cart">Cart</a></nav></header>{children}<footer><p>Fakumoya Bakery · Seshego, Polokwane, Limpopo</p><p>We are breadwinners.</p></footer></body></html>;
}
