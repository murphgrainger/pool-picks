import React from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { gql, useMutation } from '@apollo/client'
import toast, { Toaster } from 'react-hot-toast'


interface Props {
  memberId: number;
  onSubmitSuccess: (username: string) => void;
}

type FormValues = {
    username: string;
  }

const CreateUsernameMutation = gql`
mutation($id: ID!, $username: String!) {
  updatePoolMemberUsername(id: $id, username: $username) { id }
}
`;  

const UsernameCreate: React.FC<Props> = ({ memberId, onSubmitSuccess }) => {
  
    const [updateMember, { data, loading, error }] = useMutation(CreateUsernameMutation)
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset
    } = useForm<FormValues>()

    const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
      const { username } = data
      const variables = { id: memberId, username }
      try {
        await updateMember({ variables });
        toast.success('Username updated!🎉');
        onSubmitSuccess(username);
      } catch (error) {
        console.error(error);
        toast.error(`Something went wrong 😥 Please try again -  ${error}`);
      }
      reset();
    };
    

    return (
      <div className="w-full mt-6">
      <Toaster />
         <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid grid-cols-1 gap-y-3 p-4 rounded-lg bg-grey-100 mb-2">              
        <h4 className="font-bold">Step 1: Set Your Pool Username</h4>
        <span>So pool fellow members knows who you are!</span>
              <label className="block">
                <input
                    placeholder="Username"
                    {...register('username', { required: true })}
                    name="username"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                />
                </label>
                <button
                disabled={loading}
                type="submit"
                className="my-4 capitalize bg-grey-50 text-black font-medium py-2 px-4 rounded-md hover:bg-yellow"
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
                    Setting...
                    </span>
                ) : (
                    <span>Set Username</span>
                )}
                </button>
            </form>
        </div>
    )
}

export default UsernameCreate;