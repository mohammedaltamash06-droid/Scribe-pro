"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export default function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const theme = mounted ? (resolvedTheme ?? "system") : "system";
  return <Sonner theme={theme as any} {...props} />;
}
