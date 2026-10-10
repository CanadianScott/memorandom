"use client";

import { useUser } from "@/lib/user/context";
import { USERS, UserId } from "@/lib/user/users";

export function UserSwitcher() {
  const { userId, setUserId } = useUser();

  return (
    <div className="flex items-center gap-1 p-1 bg-aged-paper/60 border border-warm-brown/20 rounded-full shadow-xs">
      {(Object.values(USERS) as typeof USERS[UserId][]).map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => setUserId(u.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-serif font-semibold transition-all duration-200 cursor-pointer ${
            userId === u.id
              ? "bg-warm-brown text-white shadow-sm"
              : "text-warm-brown/70 hover:text-warm-brown hover:bg-warm-brown/10"
          }`}
          aria-pressed={userId === u.id}
        >
          {u.label}
        </button>
      ))}
    </div>
  );
}
