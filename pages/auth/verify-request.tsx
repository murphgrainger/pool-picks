import Head from "next/head"
import { useEffect, useState } from "react"
import { useSession } from 'next-auth/react'
import Router from 'next/router'

export default function VerifyRequest() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated") {
          Router.replace('/');
        }
      }, [session, status]);

    return (
        <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <Head>        
            <title>Verify Email | PoolPicks</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="bg-grey-50 w-full max-w-md p-10 rounded flex flex-col items-center text-center">
            <h1>Check Your Email</h1>
            <p className="mt-6">We sent you a verification link so you can sign into PoolPicks.</p>
        </div>
        </div>
    )

}