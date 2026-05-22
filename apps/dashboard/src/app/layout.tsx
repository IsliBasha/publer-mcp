import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Publer MCP Dashboard',
  description: 'AI-native social media management powered by MCP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
