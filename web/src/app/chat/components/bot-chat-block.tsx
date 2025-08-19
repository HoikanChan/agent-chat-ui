// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useState, useRef, useCallback } from "react";
import { cn } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Markdown } from "~/components/deer-flow/markdown";
import { ScrollContainer } from "~/components/deer-flow/scroll-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";

interface BotMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BotData {
  label: string;
  content: any;
  return_type: "normal" | "stream";
}

interface BotChatBlockProps {
  className?: string;
  onBotData?: (data: BotData[]) => void;
}

export function BotChatBlock({ className, onBotData }: BotChatBlockProps) {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [botData, setBotData] = useState<BotData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: BotMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setBotData([]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("http://localhost:3001/freestyle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage.content,
        }),
        signal: abortController.signal,
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Add final assistant message if there's accumulated content
              if (accumulatedContent.trim()) {
                const assistantMessage: BotMessage = {
                  role: "assistant",
                  content: accumulatedContent.trim(),
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
              }
              break;
            }

            try {
              const parsed = JSON.parse(data);
              setBotData(prev => {
                const newData = [...prev, parsed];
                onBotData?.(newData);
                return newData;
              });
              
              // For chat responses, accumulate content
              if (parsed.content && typeof parsed.content === 'string') {
                accumulatedContent += parsed.content + "\n\n";
              }
            } catch (e) {
              console.error("Failed to parse bot data:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Chat error:", error);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "抱歉，发生了错误，请稍后重试。",
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Chat Messages Area */}
      <div className="flex-1 min-h-0">
        <ScrollContainer className="h-full px-4">
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <Card
                  className={cn(
                    "max-w-[80%] break-words",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <CardContent className="p-3">
                    <Markdown content={message.content} />
                  </CardContent>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-bounce">🤖</div>
                      <span>AI助手正在思考中...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollContainer>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="请输入您的问题..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button onClick={handleCancel} variant="outline">
              取消
            </Button>
          ) : (
            <Button onClick={handleSendMessage} disabled={!input.trim()}>
              发送
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}