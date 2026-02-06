"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type UnreadMessagesContextValue = {
  unreadCount: number;
  addUnread: () => void;
  clearUnread: () => void;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(
  null
);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const addUnread = useCallback(() => {
    setUnreadCount((n) => n + 1);
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <UnreadMessagesContext.Provider
      value={{ unreadCount, addUnread, clearUnread }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const ctx = useContext(UnreadMessagesContext);
  return ctx ?? { unreadCount: 0, addUnread: () => {}, clearUnread: () => {} };
}
