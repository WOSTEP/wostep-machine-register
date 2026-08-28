export function ScreenShell({
  children,
  background = "var(--white)",
}: {
  children: React.ReactNode;
  background?: string;
}) {
  return (
    <div className="screen-shell" style={{ background }}>
      {children}
    </div>
  );
}
