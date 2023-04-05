import { useState } from 'react';
import Link from 'next/link'
import { useSession, signOut } from "next-auth/react";

const Header = () => {
  const { data: session } = useSession()
  const [isLoading, setLoading] = useState(false)

  return (
    <header className="body-font bg-green-500">
      <div className="container mx-auto flex flex-wrap p-5 md:flex-row justify-between">
        <Link href="/" className="flex title-font font-medium items-center md:mb-0">
          <span className="pr-2 text-2xl">⛳</span>
          <h3>PoolPicks</h3>
        </Link>
        <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          { session?.user && (
            <div className="flex items-center space-x-5">
              <button 
              className="rounded bg-green-300 hover:bg-yellow" 
              onClick={() => {
                signOut({ callbackUrl: '/' })
                setLoading(true)
                }}>{ isLoading ? (
                  <span className="flex items-center justify-center ">
                    <svg
                      className="w-6 h-6 animate-spin mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                  </span>
                ) : (
                  <span>Logout</span>
                )
              }</button>
            </div>
          )
        }
        </nav>
      </div>
    </header>
  )
}

export default Header
