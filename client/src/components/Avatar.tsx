interface Props {
  avatar: string; // emoji atau data URL foto (diawali "data:")
  color: string;
  size?: number;
  className?: string;
  title?: string;
}

/** Menampilkan avatar: foto (jika data URL) atau emoji. */
export function Avatar({ avatar, color, size = 30, className = '', title }: Props) {
  const isPhoto = avatar.startsWith('data:');
  return (
    <span
      className={`avatar ${className}`}
      style={{
        borderColor: color,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.56),
      }}
      title={title}
    >
      {isPhoto ? (
        <img className="avatar-img" src={avatar} alt={title ?? 'avatar'} />
      ) : (
        avatar
      )}
    </span>
  );
}
