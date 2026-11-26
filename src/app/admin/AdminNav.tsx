import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/servers", label: "Servers" },
  { href: "/admin/owners", label: "Owners" },
  { href: "/admin/audit", label: "Audit" },
];

export default function AdminNav({ current }: { current: string }) {
  return (
    <nav aria-label="Admin" className="mb-8 flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="chip px-4 py-1.5 text-sm nav-link"
          aria-current={current === l.href ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
