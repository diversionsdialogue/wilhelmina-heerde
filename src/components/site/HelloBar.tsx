export function HelloBar() {
  const message =
    "Helaas gaat vanwege het extreme weer ons concert op Vosbergen niet door.";

  const separator = (
    <span className="w-hello-bar__sep" aria-hidden="true">
      <svg viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 1.5L18.5 16.5H1.5L10 1.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <text
          x="10"
          y="13.5"
          textAnchor="middle"
          fill="var(--w-gold)"
          fontSize="10"
          fontWeight="700"
          fontFamily="var(--font-primary)"
        >
          !
        </text>
      </svg>
    </span>
  );

  const item = (
    <span className="w-hello-bar__item">
      {separator}
      {message}
    </span>
  );

  return (
    <div className="w-hello-bar" role="alert">
      <span className="w-hello-bar__text">{message}</span>
      <div className="w-hello-bar__ticker">
        <div className="w-hello-bar__track">
          {item}
          {item}
          {item}
          {item}
        </div>
      </div>
    </div>
  );
}
