import { VisitorSignInClient } from "./VisitorSignInClient";

export default async function VisitorSignInPage({
  searchParams,
}: PageProps<"/visitor-signin">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : "/scan";

  return <VisitorSignInClient next={nextPath} />;
}
