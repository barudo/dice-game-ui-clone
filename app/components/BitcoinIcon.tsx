import type { SVGProps } from "react";

type BitcoinIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function BitcoinIcon({ size = 16, ...props }: BitcoinIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M13.11 5.1 12.75 6.5h1.1l.35-1.4h1.38l-.38 1.52c1.3.38 2.12 1.17 2.12 2.31 0 .91-.46 1.6-1.35 2 .99.34 1.58 1.08 1.58 2.16 0 1.64-1.18 2.67-3.25 2.95l-.4 1.57h-1.38l.38-1.5h-1.14l-.38 1.5H10l.39-1.54H7.95l.54-2.13h.98c.34 0 .5-.12.58-.43l1.1-4.34c.09-.35-.05-.5-.38-.5h-.98l.53-2.17h2.52l.35-1.4h1.38Zm-1.05 8.85h1.79c.82 0 1.24-.35 1.24-.95 0-.53-.38-.78-1.17-.78h-1.43l-.43 1.73Zm.87-3.47h1.47c.77 0 1.14-.31 1.14-.88 0-.48-.34-.72-1.03-.72h-1.2l-.38 1.6Z"
        fill="#fff"
      />
    </svg>
  );
}
