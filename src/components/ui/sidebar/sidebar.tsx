"use client";

import styles from "./sidebar.module.scss";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Sidebar({ isOpen, onClose, children }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={styles.sidebar}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  );
}
