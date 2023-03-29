// pages/_app.tsx
import { SessionProvider } from "next-auth/react"
import '../styles/tailwind.css'
import Layout from '../components/Layout'
import { ApolloProvider } from '@apollo/client'
import type { AppProps } from 'next/app'
import apolloClient from '../lib/apollo'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider
    session={pageProps.session}>
      <ApolloProvider client={apolloClient}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ApolloProvider>
    </SessionProvider>

  )
}

export default MyApp
