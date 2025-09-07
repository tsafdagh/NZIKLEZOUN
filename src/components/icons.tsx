import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 15l5.2- obligación" />
      <path d="M4 9l5.2 5.2" />
      <path d="m14 4 6 6-6 6" />
      <path d="M4 9h10.5" />
      <path d="M4 15h10.5" />
    </svg>
  );
}
