import styles from "./hub.module.css";
import { getMonogram, getMonogramColors } from "./hub-model";

/*
 * Photo-free avatar: real member photos are never collected, so records are
 * represented by a monogram on a name-derived warm gradient instead.
 */
export function HubAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const [from, to] = getMonogramColors(name);

  return (
    <span
      aria-hidden="true"
      className={styles.avatar}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: `${Math.round(size * 0.34)}px`,
        height: `${size}px`,
        width: `${size}px`,
      }}
    >
      {getMonogram(name)}
    </span>
  );
}
