/**
 * LOGIN / SIGNUP PAGE (/login) — username + password only, no email.
 * The ?next= query param says where to send the user afterwards
 * (e.g. /login?next=/post from the post form).
 */
import AuthForm from "@/components/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm next={next ?? null} />;
}
