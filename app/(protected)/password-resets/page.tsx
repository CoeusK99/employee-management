import { listResetRequests } from "@/actions/password-reset";
import { ResetManager } from "@/components/password-resets/reset-manager";

export default async function PasswordResetsPage() {
  const requests = await listResetRequests();

  return (
    <ResetManager
      requests={requests.map((r) => ({
        id: r.id,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
      }))}
    />
  );
}
