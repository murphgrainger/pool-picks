"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";
import { useEffect, useRef, useState } from "react";

type FormValues = {
  name: string;
  amount_entry: string;
  tournament_id: string;
};

function formatDateRange(start: Date, end: Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = s.toLocaleDateString("en-US", opts);
  const endStr = e.toLocaleDateString("en-US", opts);
  return `${startStr} - ${endStr}`;
}

export default function PoolCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentIdParam = searchParams?.get("tournament_id") ?? null;

  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<{
    id: number;
    name: string;
    course: string;
    start_date: Date;
    end_date: Date;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>();

  const { data: tournaments, isLoading: tournamentsLoading } =
    trpc.tournament.listSelectable.useQuery();

  // Pre-select tournament from query param
  useEffect(() => {
    if (tournamentIdParam && tournaments) {
      const match = tournaments.find(
        (t) => t.id === parseInt(tournamentIdParam, 10)
      );
      if (match) {
        setSelectedTournament({
          id: match.id,
          name: match.name,
          course: match.course,
          start_date: match.start_date,
          end_date: match.end_date,
        });
        setSearchText(match.name);
        setValue("tournament_id", String(match.id));
      }
    }
  }, [tournamentIdParam, tournaments, setValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTournaments = tournaments?.filter((t) =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

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

  const handleSelectTournament = (tournament: NonNullable<typeof tournaments>[number]) => {
    setSelectedTournament({
      id: tournament.id,
      name: tournament.name,
      course: tournament.course,
      start_date: tournament.start_date,
      end_date: tournament.end_date,
    });
    setSearchText(tournament.name);
    setValue("tournament_id", String(tournament.id));
    setIsOpen(false);
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

        {/* Tournament Typeahead */}
        <div className="block" ref={dropdownRef}>
          <span className="text-white">Tournament</span>
          <input type="hidden" {...register("tournament_id", { required: true })} />
          <input
            type="text"
            placeholder={tournamentsLoading ? "Loading tournaments..." : "Search tournaments..."}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setIsOpen(true);
              if (selectedTournament) {
                setSelectedTournament(null);
                setValue("tournament_id", "");
              }
            }}
            onFocus={() => setIsOpen(true)}
            className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {isOpen && filteredTournaments && filteredTournaments.length > 0 && (
            <ul className="mt-1 max-h-60 overflow-y-auto rounded-md bg-grey-200 border border-grey-75 shadow-lg">
              {filteredTournaments.map((t) => (
                <li
                  key={t.id}
                  onClick={() => handleSelectTournament(t)}
                  className={`px-3 py-2 cursor-pointer hover:bg-grey-75 ${
                    selectedTournament?.id === t.id ? "bg-grey-75" : ""
                  }`}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.course} &middot;{" "}
                    {formatDateRange(t.start_date, t.end_date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {isOpen && filteredTournaments && filteredTournaments.length === 0 && searchText && (
            <div className="mt-1 px-3 py-2 rounded-md bg-grey-200 border border-grey-75 text-gray-400 text-sm">
              No tournaments found
            </div>
          )}
        </div>

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
