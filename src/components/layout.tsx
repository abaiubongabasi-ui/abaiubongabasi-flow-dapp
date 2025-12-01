import type { ReactNode } from 'react'
import { Header } from './header'
import { Footer } from './footer'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">{children}</main>
      <Footer />
    </div>
  )
}
