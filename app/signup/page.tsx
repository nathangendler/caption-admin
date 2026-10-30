import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData } from "@/lib/admin/pipeline";
import { deleteRow } from "@/lib/admin/crud";
import { AddValueForm } from "@/components/ReferenceForms";
import { DeleteButton } from "@/components/Forms";

export default async function SignupRulesPage() {
  await requireSuperadmin();
  const data = await loadPipelineData();
  const open = data.domains.length === 0 && data.whitelist.length === 0;
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Sign-up rules</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {open
            ? "No rules are set, so anyone can sign in. Add a domain or an address to start restricting."
            : "Only these domains and addresses can sign in. Superadmins are always allowed."}
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Allowed sign-up domains ({data.domains.length})</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {data.domains.map((d) => (
            <li key={d.domain} className="flex items-center gap-3 rounded border border-black p-2">
              <span className="flex-1">{d.domain}</span>
              <DeleteButton confirmText={`Remove ${d.domain}?`} onDelete={deleteRow.bind(null, "allowed_signup_domains", d.domain)} />
            </li>
          ))}
          {data.domains.length === 0 && <li className="text-neutral-600">None.</li>}
        </ul>
        <AddValueForm table="allowed_signup_domains" column="domain" label="Domain" placeholder="columbia.edu" />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Whitelisted e-mail addresses ({data.whitelist.length})</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {data.whitelist.map((w) => (
            <li key={w.email} className="flex items-center gap-3 rounded border border-black p-2">
              <span className="flex-1">{w.email}</span>
              <DeleteButton confirmText={`Remove ${w.email}?`} onDelete={deleteRow.bind(null, "whitelisted_emails", w.email)} />
            </li>
          ))}
          {data.whitelist.length === 0 && <li className="text-neutral-600">None.</li>}
        </ul>
        <AddValueForm table="whitelisted_emails" column="email" label="E-mail address" placeholder="friend@gmail.com" />
      </section>
    </main>
  );
}
