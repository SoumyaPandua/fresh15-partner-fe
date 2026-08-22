"use client";

import { usePathname, useParams as useNextParams, useRouter as useNextRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import NextLink from "next/link";
import { useCallback } from "react";

export function Link({ to, href, children, ...props }: any) {
  return <NextLink href={href ?? to} {...props}>{children}</NextLink>;
}

export function useNavigate() {
  const router = useNextRouter();
  return useCallback((options: string | { to?: string; href?: string; replace?: boolean; params?: Record<string, string>; search?: Record<string, string | undefined> } | undefined) => {
    if (!options) return;
    if (typeof options === "string") return router.push(options);
    let target = options.to ?? options.href ?? "/";
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        target = target.replace(`$${key}`, encodeURIComponent(value));
        target = target.replace(`[${key}]`, encodeURIComponent(value));
      }
    }
    if (options.search) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.search)) if (value != null) params.set(key, value);
      const query = params.toString();
      if (query) target += target.includes("?") ? `&${query}` : `?${query}`;
    }
    return options.replace ? router.replace(target) : router.push(target);
  }, [router]);
}

export function useRouterState<T>({
  select,
}: {
  select: (state: { location: { pathname: string } }) => T;
}): T {
  const pathname = usePathname() ?? "/";
  return select({ location: { pathname } });
}

export function useSearchParams() {
  return useNextSearchParams();
}

export function useParams() {
  return useNextParams<Record<string, string>>();
}

export function createFileRoute(_path: string) {
  return (config: any) => {
    const Component = config.component;
    return {
      ...config,
      component: Component,
      useSearch: () => {
        const searchParams = useNextSearchParams();
        const raw: Record<string, string> = {};
        searchParams.forEach((value, key) => { raw[key] = value; });
        return config.validateSearch ? config.validateSearch(raw) : raw;
      },
      useParams: () => useNextParams(),
      useRouteContext: () => ({}),
    };
  };
}
