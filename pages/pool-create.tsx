import Head from "next/head";
import React from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { gql, useMutation } from '@apollo/client'
import toast, { Toaster } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useEffect } from "react"
import Router from 'next/router'

type FormValues = {
    name: string;
    amount_entry: string;
    tournament_id: string;
  }
  
  const CreatePoolMutation = gql`
    mutation($name: String!, $amount_entry: Int!, $tournament_id: Int!) {
      createPool(name: $name, amount_entry: $amount_entry, tournament_id: $tournament_id) {
        name
        amount_entry
        tournament {
          id
        }
      }
    }
  `


const PoolCreate = () => {
  const { data: session, status } = useSession()
  useEffect(() => {
    if(status === "unauthenticated") Router.replace('/auth/signin')
  }, [status])
  
    const [createPool, { data, loading, error }] = useMutation(CreatePoolMutation)
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset
    } = useForm<FormValues>()

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        const { name, amount_entry, tournament_id } = data
        const variables = { name, amount_entry: parseInt(amount_entry, 10), tournament_id: parseInt(tournament_id, 10) }
        try {
          toast.promise(createPool({ variables }), {
            loading: 'Creating new pool..',
            success: 'Pool successfully created!🎉',
            error: `Something went wrong 😥 Please try again -  ${error}`,
          })
          reset()
        } catch (error) {
          console.error(error)
        }
      }

    return (
        <div className="container mx-auto max-w-md">
          <Head>        
            <title>Create Pool | PoolPicks</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
         <Toaster />
            <form className="grid grid-cols-1 gap-y-4 shadow-lg p-8 rounded-lg bg-grey-100 text-white" onSubmit={handleSubmit(onSubmit)}>
              <h1 className="text-3xl font-medium">Create a Pool</h1>
              <label className="block">
                <span className="text-white">Name</span>
                <input
                    placeholder="i.e. Grainger Masters 2023"
                    {...register('name', { required: true })}
                    name="name"
                    type="text"
                    className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                </label>
                <label className="block">
                <span className="text-white">Tournament</span>
                <input
                    placeholder=""
                    {...register('tournament_id', { required: true })}
                    name="tournament_id"
                    type="number"
                    className="mt-1 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                </label>
                <label className="block">
                <span className="text-white">Entry Amount</span>
                <input
                    {...register('amount_entry')}
                    name="amount_entry"
                    type="number"
                    inputMode='numeric'
                    className="mt-1 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                </label>

                <button
                disabled={loading}
                type="submit"
                className="my-4 capitalize bg-green-500 text-black font-medium py-2 px-4 rounded-md hover:bg-green-600"
                >
                {loading ? (
                    <span className="flex items-center justify-center">
                    <svg
                        className="w-6 h-6 animate-spin mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                    Creating...
                    </span>
                ) : (
                    <span>Create Pool</span>
                )}
                </button>
            </form>
        </div>
    )
}

export default PoolCreate;