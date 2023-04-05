import { useState } from "react";
import { getCsrfToken, getProviders, signIn } from "next-auth/react"
import { getSession } from "next-auth/react";


export default function SignIn({providers} : any, {csrfToken}: any) {

  const googleProvider = providers.google;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);

    const handleSubmit = async (e:any) => {
      e.preventDefault();
      setLoading(true);
      setError("");
  
      const result = await signIn("email", { email });
  
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    };

  return (
    <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
      <div className="bg-grey-50 w-full max-w-md p-10 rounded flex flex-col items-center">
        <h1 className="mb-8">Sign In</h1>
    { googleProvider && (
      <button onClick={() => {
        signIn(googleProvider.id, { callbackUrl: '/' });
        setLoadingButtonId('oauth-1');
        }}
        className="w-full mb-8 button-oauth rounded hover:bg-gray-100 active:bg-gray-100 h-14"
        disabled={loadingButtonId !== null}
        >
          { loadingButtonId === `oauth-1` ? (
                    <span className="flex items-center justify-center ">
                      <svg
                        className="w-6 h-6 animate-spin mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    <span className="flex items-center"><img src="/google_logo.svg" alt="Google Icon" className="oauth-logo"/>
                    Continue with {googleProvider.name}</span>
                  )
                }
        </button>
      )
      }
      <hr className="mt-4 mb-4"></hr>

      <form onSubmit={handleSubmit} className="flex flex-col mt-6 w-full">
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
          <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          className="w-full rounded h-14"
          value={email}
          onChange={(e) => setEmail(e.target.value)}/>
          <button type="submit" className="mt-4 bg-grey-200 text-white hover:bg-black rounded" disabled={loading}>
          {loading ? "Sending you an email..." : "Continue with Email"}
        </button>
        {error && <p className="mt-2 text-yellow">{error}</p>}        </form>
      </div>
    </div>
  )
}

export async function getServerSideProps(context:any) {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const csrfToken = await getCsrfToken(context)
  const providers = await getProviders()

  return {
    props: { providers, csrfToken },
  }
}