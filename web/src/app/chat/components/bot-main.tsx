// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useState, useCallback } from "react";
import { cn } from "~/lib/utils";
import { BotChatBlock } from "./bot-chat-block";
import { BotResearchBlock } from "./bot-research-block";

interface BotData {
  label: string;
  content: any;
  return_type: "normal" | "stream";
  timestamp?: Date;
}

export default function BotMain() {
  const [botData, setBotData] = useState<BotData[]>([]);
  const [showResearch, setShowResearch] = useState(false);

  const handleBotData = useCallback((data: BotData[]) => {
    setBotData(data);
    setShowResearch(data.length > 0);
  }, []);

  return (
    <div className="flex h-full w-full justify-center px-4 pt-12 pb-4">
      <div className={cn(
        "flex w-full max-w-7xl gap-4 transition-all duration-300",
        showResearch ? "gap-8" : ""
      )}>
        {/* Chat Block */}
        <div className={cn(
          "transition-all duration-300 ease-out",
          showResearch ? "w-1/2" : "w-full max-w-4xl mx-auto"
        )}>
          <BotChatBlock 
            className="h-full"
            onBotData={handleBotData}
          />
        </div>

        {/* Research Block */}
        <div className={cn(
          "transition-all duration-300 ease-out",
          showResearch ? "w-1/2" : "w-0 scale-0"
        )}>
          {showResearch && (
            <BotResearchBlock 
              className="h-full"
              botData={botData}
            />
          )}
        </div>
      </div>
    </div>
  );
}