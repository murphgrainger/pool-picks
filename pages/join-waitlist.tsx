import Head from "next/head";

const JoinWaitlist = () => {
    return (
        <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col text-center">
            <Head>        
                <title>Join Waitlist | PoolPicks</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="bg-green-100 rounded m-6 p-10">
                <h1 className="">Access Denied</h1>
                <h3 className="mb-4">We're in Beta</h3>
                <p>Currently only beta testers are allowed to use this app.</p>
                <p className="mt-4">Reach out to the app developer to be added to a waitlist.</p>
            </div>
        </div>
    )
}

export default JoinWaitlist;