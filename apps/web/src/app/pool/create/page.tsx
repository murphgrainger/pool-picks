"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";
import { useEffect, useRef, useState } from "react";

type FormValues = {
  name: string;
  amount_entry: string;
  tournament_id: string;
  username: string;
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

  const [isRedirecting, setIsRedirecting] = useState(false);

  const createPool = trpc.pool.create.useMutation({
    onSuccess: (data) => {
      setIsRedirecting(true);
      router.push(`/pool/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Something went wrong: ${error.message}`);
    },
  });

  const isLoading = createPool.isPending || isRedirecting;

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    createPool.mutate({
      name: data.name,
      amount_entry: parseFloat(data.amount_entry),
      tournament_id: parseInt(data.tournament_id, 10),
      username: data.username,
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
      <form
        className="grid grid-cols-1 gap-y-4 shadow-sm p-8 rounded-lg bg-white border border-grey-100"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-3xl font-medium">Create a Pool</h1>

        <label className="block">
          <span>Name</span>
          <input
            placeholder="i.e. Grainger Masters 2025"
            {...register("name", { required: true })}
            name="name"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>

        <div className="block" ref={dropdownRef}>
          <span>Tournament</span>
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {isOpen && filteredTournaments && filteredTournaments.length > 0 && (
            <ul className="mt-1 max-h-60 overflow-y-auto rounded-md bg-white border border-grey-300 shadow-lg">
              {filteredTournaments.map((t) => (
                <li
                  key={t.id}
                  onClick={() => handleSelectTournament(t)}
                  className={`px-3 py-2 cursor-pointer hover:bg-grey-200 ${
                    selectedTournament?.id === t.id ? "bg-grey-200" : ""
                  }`}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-grey-75">
                    {formatDateRange(t.start_date, t.end_date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {isOpen && filteredTournaments && filteredTournaments.length === 0 && searchText && (
            <div className="mt-1 px-3 py-2 rounded-md bg-white border border-grey-300 text-grey-75 text-sm">
              No tournaments found
            </div>
          )}
        </div>

        <label className="block">
          <span>Entry Amount</span>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
              $
            </span>
            <input
              {...register("amount_entry", {
                required: true,
                onChange: (e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = raw.split(".");
                  const formatted =
                    parts.length > 1
                      ? parts[0] + "." + parts[1].slice(0, 2)
                      : raw;
                  e.target.value = formatted;
                },
              })}
              name="amount_entry"
              type="text"
              inputMode="decimal"
              placeholder="0"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 pl-7"
            />
          </div>
        </label>

        <label className="block">
          <span>Your Commissioner Nickname</span>
          <input
            placeholder="i.e. MurphMoney"
            {...register("username", { required: true })}
            name="username"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>

        <button
          disabled={isLoading}
          type="submit"
          className="my-4 capitalize bg-green-700 text-white font-medium py-2 px-4 rounded-md hover:bg-gold hover:text-black"
        >
          {isLoading ? (
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
