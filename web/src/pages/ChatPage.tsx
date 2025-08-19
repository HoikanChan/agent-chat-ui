// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { GithubOutlined } from "@ant-design/icons";
import { lazy } from "react";
import { useTranslations } from "~/lib/i18n-react";
import { Suspense } from "react";

import { Button } from "~/components/ui/button";

import { Logo } from "~/components/deer-flow/logo";
import { ThemeToggle } from "~/components/deer-flow/theme-toggle";
import { Tooltip } from "~/components/deer-flow/tooltip";
import { SettingsDialog } from "~/app/settings/dialogs/settings-dialog";

const BotMain = lazy(() => import("~/app/chat/components/bot-main"));

export default function ChatPage() {
  const t = useTranslations("chat.page");
  
  // Check URL params to determine which mode to use
  const searchParams = new URLSearchParams(window.location.search);
  const isBotMode = searchParams.has("bot") || window.location.pathname.includes("bot");

  return (
    <div className="flex h-screen w-screen justify-center overscroll-none">
      <header className="fixed top-0 left-0 flex h-12 w-full items-center justify-between px-4">
        <Logo />
      </header>
      <Suspense fallback={
        <div className="flex h-full w-full items-center justify-center">
          Loading DeerFlow...
        </div>
      }>
        <BotMain />
      </Suspense>
    </div>
  );
}
