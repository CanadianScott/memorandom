"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserId, DEFAULT_USER, ACTIVE_USER_KEY } from "./users";

interface UserContextValue {
  userId: UserId;
  setUserId: (id: UserId) => void;
}

const UserContext = createContext<UserContextValue>({
  userId: DEFAULT_USER,
  setUserId: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<UserId>(DEFAULT_USER);

  // Read from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_USER_KEY) as UserId | null;
      if (stored === "blair" || stored === "scott") {
        setUserIdState(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setUserId = (id: UserId) => {
    setUserIdState(id);
    try {
      localStorage.setItem(ACTIVE_USER_KEY, id);
    } catch {
      // ignore
    }
  };

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
