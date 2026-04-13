"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";

import {
  initMixpanel,
  identifyUser,
  resetUser,
  trackEvent,
  MIXPANEL_EVENTS,
} from "@/lib/analytics/mixpanel";

type Props = {
  children: React.ReactNode;
};

export default function MixpanelProvider({ children }: Props) {
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      identifyUser(session.user.id, {
        $email: session.user.email ?? undefined,
        $name: session.user.name ?? undefined,
        locale,
      });
      wasAuthenticatedRef.current = true;
      return;
    }

    if (status === "unauthenticated" && wasAuthenticatedRef.current) {
      resetUser();
      wasAuthenticatedRef.current = false;
    }
  }, [status, session?.user?.id, session?.user?.email, session?.user?.name, locale]);

  useEffect(() => {
    if (!pathname) return;
    trackEvent(MIXPANEL_EVENTS.PAGE_VIEWED, { path: pathname, locale });
  }, [pathname, locale]);

  return children;
}
