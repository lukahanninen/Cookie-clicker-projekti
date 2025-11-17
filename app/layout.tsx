import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cookie Clicker Deluxe 🍪',
  description:
    'Bake cookies, earn upgrades, and rise on the leaderboard in this sweet dark-themed incremental game!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 font-['Fredoka'] antialiased`}
      >
        {/* Header */}
        <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍪</span>
              <h1 className="text-2xl font-bold tracking-wide text-yellow-400 drop-shadow-[0_0_8px_rgba(255,204,0,0.6)]">
                Cookie Clicker Deluxe
              </h1>
            </div>
            <nav className="flex gap-4">
              <a
                href="/game"
                className="px-3 py-2 rounded-md hover:bg-yellow-400/20 text-yellow-300 transition-all"
              >
                Game
              </a>
              <a
                href="/leaderboard"
                className="px-3 py-2 rounded-md hover:bg-yellow-400/20 text-yellow-300 transition-all"
              >
                Leaderboard
              </a>
              <a
                href="/login"
                className="px-3 py-2 rounded-md hover:bg-yellow-400/20 text-yellow-300 transition-all"
              >
                Login
              </a>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>

        {/* Footer */}
        <footer className="text-center text-gray-400 py-6 border-t border-gray-700 mt-10">
          Made with ❤️ and 🍪 by Zeko! and Flaze!
        </footer>
      </body>
    </html>
  )
}
