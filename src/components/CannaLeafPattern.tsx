type CannaLeafPatternProps = {
  className?: string;
};

export default function CannaLeafPattern({
  className = "",
}: CannaLeafPatternProps) {
  return (
    <svg
      viewBox="0 0 420 420"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M210 372C210 372 202 285 210 210"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path
        d="M210 210C178 158 167 92 210 32C253 92 242 158 210 210Z"
        fill="currentColor"
      />

      <path
        d="M198 218C142 192 94 145 92 72C158 99 190 155 198 218Z"
        fill="currentColor"
      />

      <path
        d="M222 218C278 192 326 145 328 72C262 99 230 155 222 218Z"
        fill="currentColor"
      />

      <path
        d="M188 238C128 242 66 219 34 156C107 153 164 187 188 238Z"
        fill="currentColor"
      />

      <path
        d="M232 238C292 242 354 219 386 156C313 153 256 187 232 238Z"
        fill="currentColor"
      />

      <path
        d="M184 265C134 290 74 291 24 248C88 218 149 222 184 265Z"
        fill="currentColor"
      />

      <path
        d="M236 265C286 290 346 291 396 248C332 218 271 222 236 265Z"
        fill="currentColor"
      />
    </svg>
  );
}