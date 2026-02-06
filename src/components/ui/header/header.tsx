"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "../menu/menu";
import styles from "./header.module.scss";

type HeaderProps = {
  /** "candidate" = menu só Mensagens/Processos + tema; "company" = menu completo */
  variant?: "company" | "candidate";
};

export function Header({ variant = "company" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const logoHref = variant === "candidate" ? "/candidato" : "/dashboard";

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <div className={styles.menu}>
            <Image
              src="/svg/menu-burger.svg"
              alt="Menu"
              width={24}
              height={24}
              onClick={() => setIsMenuOpen(true)}
            />
          </div>
          <Link href={logoHref} className={styles.logoLink}>
            <Image
              src="/svg/logo2.svg"
              alt="Nexo"
              width={60}
              height={32}
            />
          </Link>
        </div>

        <div className={styles.rigth}>
          <Image
            src="/icons/bell.svg"
            alt="Notificações"
            width={20}
            height={20}
          />
          <Image
            src="/icons/user.svg"
            alt="Perfil"
            width={20}
            height={20}
            onClick={() => setIsProfileOpen(true)}
          />
        </div>
      </header>

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        variant={variant}
      />
    </>
  );
}
