"use client";

import { deleteServer } from "./actions";

export default function DeleteServerButton({ id }: { id: string }) {
  return (
    <form action={deleteServer} onSubmit={(e) => { if (!confirm("Delete this server?")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="text-sm text-red-400 underline transition hover:text-red-300">Delete</button>
    </form>
  );
}
