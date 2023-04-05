import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from "next/link";

const ButtonLink = ( {href}:any, {children}:any ) =>  {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url:string) => {
      if (url === href) {
        setLoading(true);
      }
    };

    const handleComplete = (url:string) => {
      if (url === href) {
        setLoading(false);
      }
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router, href]);

  return (
    <Link href={href}>
      <button className="rounded bg-grey-200 hover:bg-yellow hover:text-black">
        {loading ? (
          <span className="flex items-center justify-center ">
            <svg
              className="w-6 h-6 animate-spin mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
            Going to Pool...
          </span>
        ) : (
          <span>Go To Pool</span>
        )}
      </button>
    </Link>
  );
}

export default ButtonLink;
