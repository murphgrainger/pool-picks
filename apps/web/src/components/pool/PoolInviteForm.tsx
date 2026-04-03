"use client";

import { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";

interface PoolInviteFormProps {
  poolId: number;
  existingInviteEmails: string[];
  onInviteCreated: (invite: {
    id: number;
    email: string;
    nickname: string;
    status: string;
  }) => void;
}

export function PoolInviteForm({
  poolId,
  existingInviteEmails,
  onInviteCreated,
}: PoolInviteFormProps) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: pastEmails } = trpc.poolInvite.pastEmails.useQuery(
    { pool_id: poolId },
    { staleTime: 5 * 60 * 1000 }
  );

  const createInvite = trpc.poolInvite.create.useMutation({
    onSuccess: (data) => {
      onInviteCreated(data);
      setEmail("");
      setNickname("");
      if (data.emailSent) {
        toast.success("Invite sent successfully!");
      } else {
        toast.success("Invite created! Email could not be sent.");
      }
    },
    onError: (err) => {
      const msg = err.message;
      toast.error(
        msg === "An invite has already been sent to this email" ||
          msg === "Nickname already taken in this pool"
          ? msg
          : "Error creating invite"
      );
    },
  });

  const filteredSuggestions = useMemo(() => {
    if (!pastEmails || email.length < 1) return [];
    const lower = email.toLowerCase();
    return pastEmails
      .filter(
        (p) =>
          p.email.toLowerCase().startsWith(lower) ||
          p.nickname.toLowerCase().startsWith(lower)
      )
      .map((p) => ({
        ...p,
        alreadyInvited: existingInviteEmails.includes(p.email),
      }));
  }, [pastEmails, email, existingInviteEmails]);

  const handleSelectSuggestion = (suggestion: {
    email: string;
    nickname: string;
    alreadyInvited: boolean;
  }) => {
    if (suggestion.alreadyInvited) return;
    setEmail(suggestion.email);
    setNickname(suggestion.nickname);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = filteredSuggestions[highlightedIndex];
      if (!selected.alreadyInvited) {
        handleSelectSuggestion(selected);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createInvite.mutate({ pool_id: poolId, email, nickname });
  };

  return (
    <div className="w-full bg-white border border-grey-100 rounded-lg p-4 mt-4 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Send Pool Invite via Email</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
            required
            className="w-full rounded p-2 border border-grey-300"
            placeholder="Enter email address"
            autoComplete="off"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-grey-300 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
              {filteredSuggestions.map((s, i) => (
                <li
                  key={s.email}
                  onMouseDown={() => handleSelectSuggestion(s)}
                  className={`px-3 py-2 text-sm ${
                    s.alreadyInvited
                      ? "text-gray-400 cursor-not-allowed"
                      : i === highlightedIndex
                        ? "bg-green-100 cursor-pointer"
                        : "hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  <span className={s.alreadyInvited ? "font-normal" : "font-medium"}>
                    {s.email}
                  </span>
                  <span className="text-gray-500 ml-2">
                    ({s.alreadyInvited ? "already invited" : s.nickname})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="w-full rounded p-2 border border-grey-300"
            placeholder="Enter nickname"
          />
        </div>
        <button
          type="submit"
          disabled={createInvite.isPending}
          className="w-full bg-green-700 text-white font-medium py-2 px-4 rounded hover:bg-green-900 disabled:opacity-50"
        >
          {createInvite.isPending ? (
            <span className="flex items-center justify-center">
              <Spinner className="w-6 h-6 mr-1" />
              Sending...
            </span>
          ) : (
            "Send Invite"
          )}
        </button>
      </form>
    </div>
  );
}
