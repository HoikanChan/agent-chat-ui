// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

// Bot chat main component with research panel
// Follows the same layout pattern as the original Main component

import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { BotChatBlock } from "./bot-chat-block";
import { BotResearchBlock } from "./bot-research-block";
import { useStore } from '~/core/store/agent-store';

export default function BotMain() {
  const { messageIds, messages } = useStore();

  // Convert agent store messages to array format
  const messageList = messageIds.map(id => messages.get(id)!).filter(Boolean);

  // Check if we have any tool calls or research data to show
  const hasResearchData = useMemo(() => {
    return messageList.some(message =>
      message.toolCalls && message.toolCalls.length > 0
    );
  }, [messageList]);

  const doubleColumnMode = useMemo(() => hasResearchData && messageList.length > 0, [hasResearchData, messageList.length]);

  return (
    <div className={cn(
      "flex h-full w-full justify-center-safe px-4 pt-12 pb-4",
      doubleColumnMode && "gap-8"
    )}>
      <BotChatBlock className={cn(
        "shrink-0 transition-all duration-300 ease-out",
        !doubleColumnMode &&
        `w-[768px] translate-x-[min(max(calc((100vw-538px)*0.75),575px)/2,960px/2)]`,
        doubleColumnMode && `w-[538px]`,
      )} />

      <BotResearchBlock messages={messageList} className={cn(
        "w-[min(max(calc((100vw-538px)*0.75),575px),960px)] pb-4 transition-all duration-300 ease-out",
        !doubleColumnMode && "scale-0",
        doubleColumnMode && "",
      )} />

    </div>
  );
}