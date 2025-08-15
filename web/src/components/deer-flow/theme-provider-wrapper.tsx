// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useLocation } from "react-router-dom";

import { ThemeProvider } from "~/components/theme-provider";

export function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={"dark"}
      enableSystem={true}
      forcedTheme={undefined}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
