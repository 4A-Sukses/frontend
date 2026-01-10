'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  label: string
  href: string
}

const menuItems: MenuItem[] = [
  { label: 'Home', href: '/home' },
  { label: 'Games', href: '/games' },
  { label: 'Multi-Source Knowledge', href: '/Multi-Source-Knowledge' },
  { label: 'N8N Workflow', href: '/n8n-workflow' },
  { label: 'Peer Connect', href: '/PeerConnect' },
  { label: 'AI Learning Analytics', href: '/TaskIntegrator' },
]

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-400 border-[3px] border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
        aria-label="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
          <span className={`block h-1 bg-black rounded transition-all ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
          <span className={`block h-1 bg-black rounded transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-1 bg-black rounded transition-all ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Container */}
          <div className="absolute top-full right-0 mt-2 w-56 bg-white border-[3px] border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50">
            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/home' && pathname?.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 font-bold transition-all border-l-4 ${isActive
                        ? 'bg-blue-400 text-black border-black'
                        : 'bg-white text-black border-transparent hover:bg-blue-100 hover:border-black'
                      }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
