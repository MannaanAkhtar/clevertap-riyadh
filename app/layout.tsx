import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CleverTap Majlis Al-Suhoor | Riyadh 2026',
  description: 'A Celebration of Flavor, Fellowship, and Future - Join industry leaders for an exclusive Suhoor gathering in Riyadh',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CleverTap Majlis Al-Suhoor | Riyadh 2026',
    description: 'Join industry leaders for an exclusive Suhoor gathering in Riyadh',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" 
          rel="stylesheet" 
        />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="font-sans antialiased bg-[#0a0a0a]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
