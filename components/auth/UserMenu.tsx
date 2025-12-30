"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 text-sm">
        {session.user?.name || session.user?.email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Sign out
      </button>
    </div>
  );
}
