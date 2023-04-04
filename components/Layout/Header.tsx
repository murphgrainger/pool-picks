import React from 'react'
import Link from 'next/link'
import { useSession, signOut } from "next-auth/react";


const Header = () => {
  const { data: session } = useSession()

  return (
    <header className="text-gray-600 body-font bg-green">
      <div className="container mx-auto flex flex-wrap p-5 md:flex-row justify-between">
        <Link href="/" className="flex title-font font-medium items-center text-gray-900 md:mb-0">
          <span className="pr-2 text-2xl">⛳</span>
          <h3>PoolPicks</h3>
        </Link>
        <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          { session?.user && (
            <div className="flex items-center space-x-5">
              <button className="text-black p-0" onClick={() => signOut({ callbackUrl: '/' })}>Logout</button>
            </div>
          )
        }
        </nav>
      </div>
    </header>
  )
}

export default Header
