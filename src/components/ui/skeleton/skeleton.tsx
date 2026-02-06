"use client";

import styles from "./skeleton.module.scss";

type SkeletonVariant = "text" | "title" | "card" | "avatar" | "line" | "button";

type SkeletonProps = {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
};

export function Skeleton({
  variant = "line",
  count = 1,
  className,
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      className={`${count > 1 ? styles.list : ""} ${className ?? ""}`.trim()}
    >
      {items.map((i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${styles[variant]}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

type SkeletonListProps = {
  count?: number;
  variant?: "card" | "line";
  className?: string;
};

export function SkeletonList({
  count = 5,
  variant = "card",
  className,
}: SkeletonListProps) {
  return (
    <div className={className}>
      <Skeleton variant={variant} count={count} />
    </div>
  );
}
