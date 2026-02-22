"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";

interface UsernameCreateFormProps {
  memberId: number;
  onSubmitSuccess: (username: string) => void;
}

type FormValues = {
  username: string;
};

export function UsernameCreateForm({
  memberId,
  onSubmitSuccess,
}: UsernameCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const updateUsername = trpc.poolMember.updateUsername.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Username updated!");
      onSubmitSuccess(variables.username);
      reset();
    },
    onError: (error) => {
      toast.error(`Something went wrong: ${error.message}`);
    },
  });

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    updateUsername.mutate({ id: memberId, username: data.username });
  };

  return (
    <div className="w-full mt-6">
      <Toaster />
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid grid-cols-1 gap-y-3 p-4 rounded-lg bg-grey-100 mb-2"
      >
        <h4 className="font-bold">Step 1: Set Your Pool Username</h4>
        <span>So pool fellow members knows who you are!</span>
        <label className="block">
          <input
            placeholder="Username"
            {...register("username", { required: true })}
            name="username"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
          />
        </label>
        <button
          disabled={updateUsername.isPending}
          type="submit"
          className="my-4 capitalize bg-grey-50 text-black font-medium py-2 px-4 rounded-md hover:bg-yellow"
        >
          {updateUsername.isPending ? (
            <span className="flex items-center justify-center">
              <Spinner className="w-6 h-6 mr-1" />
              Setting...
            </span>
          ) : (
            <span>Set Username</span>
          )}
        </button>
      </form>
    </div>
  );
}
