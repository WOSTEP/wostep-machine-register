/** Viewfinder-corners glyph used for "scan a QR tag" actions. */
export function ScanQrIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2 6.5V3.5C2 2.67157 2.67157 2 3.5 2H6.5M13.5 2H16.5C17.3284 2 18 2.67157 18 3.5V6.5M18 13.5V16.5C18 17.3284 17.3284 18 16.5 18H13.5M6.5 18H3.5C2.67157 18 2 17.3284 2 16.5V13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="7" y="7" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}
