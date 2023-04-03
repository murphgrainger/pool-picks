import { useState } from "react";
import { getCsrfToken, getProviders, signIn } from "next-auth/react"
import { getSession } from "next-auth/react";


export default function SignIn({providers} : any, {csrfToken}: any) {

  const googleProvider = providers.google;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
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
      <div className="bg-gray-200 w-full max-w-md p-10 rounded flex flex-col items-center">
        <h1 className="mb-10">Sign In</h1>
    { googleProvider && (
        <button onClick={() => signIn(googleProvider.id, { callbackUrl: '/' })} className="w-full mb-8 button-oauth hover:bg-gray-100 active:bg-gray-100">
          <img src="/google_logo.svg" alt="Google Icon" className="oauth-logo"/>
            Continue with {googleProvider.name}
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
          <button type="submit" className="mt-4" disabled={loading}>
          {loading ? "Sending you an email..." : "Continue with Email"}
        </button>
        {error && <p className="mt-2 text-red-600">{error}</p>}        </form>
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