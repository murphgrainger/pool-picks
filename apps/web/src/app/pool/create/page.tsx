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
  join_mode: "OPEN" | "INVITE_ONLY";
};

function formatDateRange(start: Date, end: Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = s.toLocaleDateString("en-US", opts);
  const endStr = e.toLocaleDateString("en-US", opts);
  return `${startStr} - ${endStr}`;
}

function ConfigInfoPopover({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  if (!open) return null;
  return (
    <div className="mt-2 p-3 bg-white border border-grey-100 rounded-lg shadow-lg text-sm text-grey-75">
      <p className="font-bold text-black mb-2">Pick 6, Count 4</p>
      <ul className="space-y-1">
        <li>- Pick 6 players for the tournament</li>
        <li>- Max 3 picks from the A Group (top 20 OWGR)</li>
        <li>- Your best 4 scores count toward your total</li>
        <li>- Lowest total score wins</li>
        <li>- DQ if fewer than 4 players make the cut</li>
      </ul>
      <div
        onClick={onToggle}
        className="mt-3 text-sm text-green-700 hover:text-green-900 font-bold cursor-pointer"
      >
        Got it
      </div>
    </div>
  );
}

function FeatureRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
      } else {
        toast.error("Failed to send request. Please try again.");
      }
    } catch {
      toast.error("Failed to send request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl w-full">
        {sent ? (
          <>
            <h3 className="text-lg font-bold mb-3">Request Sent</h3>
            <p className="text-sm text-grey-75 mb-4">
              Thanks for the feedback! We&apos;ll review your request and
              consider it for a future update.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                onClose();
              }}
              className="w-full px-4 py-2 rounded bg-green-700 hover:bg-green-900 text-white font-medium"
            >
              Done
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-bold mb-3">Request a Configuration</h3>
            <p className="text-sm text-grey-75 mb-4">
              Describe the pool configuration you&apos;d like to see. For
              example: number of picks, scoring rules, group restrictions, etc.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Pick 4, Count 3 with no group restrictions..."
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm mb-4"
            />
            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="w-full px-4 py-2 rounded bg-green-700 hover:bg-green-900 text-white font-medium disabled:opacity-50"
              >
                {sending ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-4 h-4 mr-2" />
                    Sending...
                  </span>
                ) : (
                  "Send Request"
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="w-full px-4 py-2 rounded text-grey-75 hover:text-black"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
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
  const configDropdownRef = useRef<HTMLDivElement>(null);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [showConfigInfo, setShowConfigInfo] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

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
      if (
        configDropdownRef.current &&
        !configDropdownRef.current.contains(e.target as Node)
      ) {
        setConfigOpen(false);
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
      join_mode: data.join_mode,
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

        {/* Pool Configuration */}
        <div className="block" ref={configDropdownRef}>
          <span>Pool Configuration</span>
          <button
            type="button"
            onClick={() => setConfigOpen(!configOpen)}
            className="mt-1 flex items-center justify-between w-full rounded-md border border-gray-300 shadow-sm bg-white px-3 py-2 text-left"
          >
            <div className="flex items-center gap-2">
              <span>Pick 6, Count 4</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfigInfo(!showConfigInfo);
                }}
                className="inline-flex items-center justify-center text-grey-75 hover:text-black transition-colors cursor-pointer"
                aria-label="Learn about this configuration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <svg className={`w-4 h-4 text-grey-75 transition-transform ${configOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {configOpen && (
            <ul className="mt-1 rounded-md bg-white border border-grey-300 shadow-lg overflow-hidden">
              <li
                onClick={() => setConfigOpen(false)}
                className="px-3 py-2 cursor-pointer bg-grey-200 font-medium"
              >
                Pick 6, Count 4
              </li>
              <li
                onClick={(e) => {
                  e.stopPropagation();
                  setConfigOpen(false);
                  setShowFeatureRequest(true);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-grey-200 text-sm text-grey-75 border-t border-grey-100"
              >
                More configurations coming soon.{" "}
                <span className="text-green-700 font-medium underline">
                  Request a new one
                </span>
              </li>
            </ul>
          )}
          <ConfigInfoPopover
            open={showConfigInfo}
            onToggle={() => setShowConfigInfo(false)}
          />
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
            placeholder="e.g. MurphMoney"
            {...register("username", { required: true })}
            name="username"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>

        <fieldset className="block">
          <legend className="font-medium">How can people join this pool?</legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="OPEN"
                defaultChecked
                {...register("join_mode")}
                className="text-green-700 focus:ring-green-700"
              />
              <span>Anyone with an invite link</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="INVITE_ONLY"
                {...register("join_mode")}
                className="text-green-700 focus:ring-green-700"
              />
              <span>Only people I invite by email</span>
            </label>
          </div>
        </fieldset>

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

      <FeatureRequestModal
        open={showFeatureRequest}
        onClose={() => setShowFeatureRequest(false)}
      />
    </div>
  );
}
