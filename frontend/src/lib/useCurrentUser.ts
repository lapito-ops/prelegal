"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, isSignedOut, type User } from "./api";

/** The signed-in user; redirects to the sign-in page when there is no session. */
export function useCurrentUser(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((err) => {
        if (isSignedOut(err)) router.replace("/");
        else console.error(err);
      });
  }, [router]);

  return user;
}

/** Sends visitors who are already signed in to `href`, e.g. from the sign-in page. */
export function useRedirectIfSignedIn(href: string) {
  const router = useRouter();

  useEffect(() => {
    getMe()
      .then(() => router.replace(href))
      .catch((err) => {
        if (!isSignedOut(err)) console.error(err);
      });
  }, [router, href]);
}
