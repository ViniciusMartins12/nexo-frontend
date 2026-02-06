"use client";

import Image from "next/image";
import styles from "./boxIcon.module.scss";

type BoxIconProps = {
    size?: number;
    icon: string;

};

export function BoxIcon({ size = 40, icon }: BoxIconProps) {
    return (
        <div className={styles.container}>
             <Image src={icon} alt="" width={size} height={size} />
        </div>
    );
}
