// components/Layout/Header.tsx
import React from 'react'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'

const Header = () => {
  const { user } = useUser()
  return (
    <header className="text-gray-600 body-font">
      <div className="container mx-auto flex flex-wrap p-5 md:flex-row justify-between">
        <Link href="/" className="flex title-font font-medium items-center text-gray-900 md:mb-0"><h3>Pool Picks</h3>
        </Link>
        <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          {user ? (
            <div className="flex items-center space-x-5">
              <Link href="/api/auth/logout" className="inline-flex items-center">
                <button>Logout</button>
              </Link>
              <img alt="profile" className="rounded-full w-12 h-12" src={user.picture ? user.picture : ''} />
            </div>
          ) : (
            <Link href="/api/auth/login" className="inline-flex items-center">
              <button>Login</button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
