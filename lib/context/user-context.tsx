"use client";

import React, { createContext, useContext } from "react";

type UserContextData = {
  name: string;
  email: string;
  roles: string[];
  forceChangePassword: boolean;
};

const UserContext = createContext<UserContextData | null>(null);

export function UserProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserContextData;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
