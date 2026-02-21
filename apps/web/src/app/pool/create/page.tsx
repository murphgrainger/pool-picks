"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";
import { useEffect } from "react";

type FormValues = {
  name: string;
  amount_entry: string;
  tournament_id: string;
};

export default function PoolCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams?.get("tournament_id") ?? null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>();

  useEffect(() => {
    if (tournamentId) {
      setValue("tournament_id", tournamentId);
    }
  }, [tournamentId, setValue]);

  const createPool = trpc.pool.create.useMutation({
    onSuccess: (data) => {
      toast.success("Pool created!");
      router.push(`/pool/${data.id}`);
      reset();
    },
    onError: (error) => {
      toast.error(`Something went wrong: ${error.message}`);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    createPool.mutate({
      name: data.name,
      amount_entry: parseInt(data.amount_entry, 10),
      tournament_id: parseInt(data.tournament_id, 10),
    });
  };

  return (
    <div className="container mx-auto max-w-md">
      <Toaster />
      <form
        className="grid grid-cols-1 gap-y-4 shadow-lg p-8 rounded-lg bg-grey-100 text-white"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-3xl font-medium">Create a Pool</h1>
        <label className="block">
          <span className="text-white">Name</span>
          <input
            placeholder="i.e. Grainger Masters 2025"
            {...register("name", { required: true })}
            name="name"
            type="text"
            className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>
        <label className="block">
          <span className="text-white">Tournament ID</span>
          <input
            placeholder=""
            {...register("tournament_id", { required: true })}
            name="tournament_id"
            type="number"
            className="mt-1 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>
        <label className="block">
          <span className="text-white">Entry Amount</span>
          <input
            {...register("amount_entry", { required: true })}
            name="amount_entry"
            type="number"
            inputMode="numeric"
            className="mt-1 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>

        <button
          disabled={createPool.isPending}
          type="submit"
          className="my-4 capitalize bg-green-500 text-black font-medium py-2 px-4 rounded-md hover:bg-green-600"
        >
          {createPool.isPending ? (
            <span className="flex items-center justify-center">
              <Spinner className="w-6 h-6 mr-1" />
              Creating...
            </span>
          ) : (
            <span>Create Pool</span>
          )}
        </button>
      </form>
    </div>
  );
}
