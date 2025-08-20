// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import React, { useRef, useCallback } from "react";
import { cn } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Markdown } from "~/components/deer-flow/markdown";
import { ScrollContainer } from "~/components/deer-flow/scroll-container";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronRight, Brain, Search, BarChart3, CheckCircle, ChevronDown, Lightbulb, Settings, Target, Code, Wrench, Database } from "lucide-react";
import { LoadingAnimation } from "~/components/deer-flow/loading-animation";
import { RollingText } from "~/components/deer-flow/rolling-text";
import { motion } from "framer-motion";
import { InputBox } from "./input-box";
import { ConversationStarter } from "./conversation-starter";
import { useStore, sendMessage, type Message, type Reasoning, type ToolCall } from '~/core/store/agent-store';
import { useUIStore } from '~/core/store/ui-store';
import { nanoid } from 'nanoid';

// Import ThoughtBlock from message-list-view
function ThoughtBlock({
  className,
  reasoning,
  hasMainContent,
}: {
  className?: string;
  reasoning: Reasoning;
  hasMainContent?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasAutoCollapsed, setHasAutoCollapsed] = React.useState(false);
  const reasoningConfig = getReasoningConfig(reasoning.label);

  React.useEffect(() => {
    if (hasMainContent && !hasAutoCollapsed) {
      setIsOpen(false);
      setHasAutoCollapsed(true);
    }
  }, [hasMainContent, hasAutoCollapsed]);

  if (!reasoning.content || reasoning.content.trim() === "") {
    return null;
  }

  return (
    <div className={cn("mb-3 w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-auto w-full justify-start rounded-xl px-6 py-4 text-left transition-all duration-200",
              "hover:bg-accent/80 cursor-pointer",
              reasoning.isStreaming
                ? "bg-primary/5"
                : "bg-accent/40",
            )}
          >
            <div className="flex w-full items-center gap-3">
              {React.createElement(reasoningConfig.icon, {
                size: 18,
                className: cn(
                  "shrink-0 text-foreground/70",
                  reasoning.isStreaming && "animate-pulse"
                )
              })}
              <span
                className={cn(
                  "leading-none font-semibold text-foreground",
                  reasoning.isStreaming && "animate-pulse"
                )}
              >
                {reasoningConfig.text}
              </span>
              <div className="flex-grow" />
              {isOpen ? (
                <ChevronDown
                  size={16}
                  className="text-muted-foreground transition-transform duration-200"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-muted-foreground transition-transform duration-200"
                />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-2 data-[state=open]:slide-down-2 mt-3">
          <Card
            className={cn(
              "transition-all duration-200 border-0",
              reasoning.isStreaming ? "bg-primary/5" : "bg-accent/20",
            )}
          >
            <CardContent>
              <div className="flex h-30 w-full overflow-y-auto">
                <ScrollContainer
                  className={cn(
                    "flex h-full w-full flex-col overflow-hidden",
                    className,
                  )}
                  scrollShadow={false}
                  autoScrollToBottom
                >
                  <Markdown
                    className={cn(
                      "text-sm prose dark:prose-invert max-w-none transition-colors duration-200",
                      reasoning.isStreaming ? "prose-primary" : "opacity-80",
                    )}
                    animated={reasoning.isStreaming}
                  >
                    {reasoning.content}
                  </Markdown>
                </ScrollContainer>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface BotChatBlockProps {
  className?: string;
  onTabSwitch?: (tabId: string) => void;
}

// Agent configuration with icons and colors
const getAgentConfig = (agentType?: string) => {
  switch (agentType) {
    case 'planning':
      return {
        icon: Search,
        name: "规划助手",
        color: "text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      };
    case 'troubleshooting':
      return {
        icon: BarChart3,
        name: "问题排查助手",
        color: "text-green-500",
        bgColor: "bg-green-50 dark:bg-green-950"
      };
    case 'summarizing':
      return {
        icon: Brain,
        name: "总结助手",
        color: "text-purple-500",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      };
    default:
      return {
        icon: CheckCircle,
        name: "AI助手",
        color: "text-orange-500",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      };
  }
};

// Reasoning configuration with user-friendly icons and text
const getReasoningConfig = (label: string) => {
  switch (label) {
    case 'troubleshooting_agent_model_thinking':
      return {
        icon: Settings,
        text: "分析问题"
      };
    case 'troubleshooting_agent_refined_apis':
      return {
        icon: Target,
        text: "API筛选"
      };
    case 'troubleshooting_agent_code_thinking':
      return {
        icon: Code,
        text: "代码分析"
      };
    default:
      return {
        icon: Lightbulb,
        text: "深度思考"
      };
  }
};

// Tool call configuration with user-friendly icons and text
const getToolCallConfig = (label: string) => {
  switch (label) {
    case 'planning_agent_knowledge':
      return {
        icon: Database,
        text: "知识检索",
        tabId: "knowledge"
      };
    case 'troubleshooting_agent_mock_status_done':
      return {
        icon: Wrench,
        text: "状态检查",
        tabId: "troubleshooting"
      };
    default:
      return {
        icon: Wrench,
        text: "工具调用",
        tabId: "tools"
      };
  }
};

// Tool Call Block component
function ToolCallBlock({
  className,
  toolCall,
  onTabSwitch,
}: {
  className?: string;
  toolCall: ToolCall;
  onTabSwitch?: (tabId: string) => void;
}) {
  const toolCallConfig = getToolCallConfig(toolCall.label);

  const handleClick = () => {
    if (onTabSwitch && toolCallConfig.tabId) {
      onTabSwitch(toolCallConfig.tabId);
    }
  };

  if (!toolCall.content || toolCall.content.trim() === "") {
    return null;
  }

  return (
    <div className={cn("mb-3 w-full", className)}>
      <Button
        variant="ghost"
        onClick={handleClick}
        className={cn(
          "h-auto w-full justify-start rounded-xl border px-6 py-4 text-left transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground cursor-pointer",
          "border-border bg-card hover:border-primary/20"
        )}
      >
        <div className="flex w-full items-center gap-3">
          {React.createElement(toolCallConfig.icon, {
            size: 18,
            className: "shrink-0 text-foreground/70"
          })}
          <span className="leading-none font-medium text-foreground">
            {toolCallConfig.text}
          </span>
          <div className="flex-grow" />
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {toolCall.content.length > 50 
              ? `${toolCall.content.slice(0, 50)}...` 
              : toolCall.content}
          </div>
          <ChevronRight
            size={16}
            className="text-muted-foreground transition-transform duration-200"
          />
        </div>
      </Button>
    </div>
  );
}

// Message List Item component
function MessageListItem({ 
  message, 
  onTabSwitch 
}: { 
  message: Message;
  onTabSwitch?: (tabId: string) => void;
}) {
  const agentConfig = getAgentConfig(message.agentType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ transition: "all 0.2s ease-out" }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {message.role === "user" ? (
        <div className="flex justify-end mt-10">
          <div className="group flex w-fit max-w-[85%] flex-col rounded-2xl px-4 py-3 shadow bg-brand rounded-ee-none text-primary-foreground">
            <Markdown>{message.content || ""}</Markdown>
          </div>
        </div>
      ) : (
        <div className="flex justify-start">
          <div className="w-full">
            {/* Main content */}

            <Card className={cn(
              "mb-3",
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    {React.createElement(agentConfig.icon, { size: 20 })}
                    <CardTitle className="text-base font-semibold" title={agentConfig.name}>
                      {agentConfig.name}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Reasoning content */}
                {message.reasoningContent && message.reasoningContent.map((reasoning, index) => (
                  <ThoughtBlock
                    key={index}
                    reasoning={reasoning}
                    hasMainContent={Boolean(message.content && message.content.trim() !== "")}
                  />
                ))}

                {/* Tool calls section */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mb-3">
                    {message.toolCalls.map((toolCall, index) => (
                      <ToolCallBlock
                        key={index}
                        toolCall={toolCall}
                        onTabSwitch={onTabSwitch}
                      />
                    ))}
                  </div>
                )}

                <Markdown>{message.content}</Markdown>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function BotChatBlock({ className, onTabSwitch }: BotChatBlockProps) {
  const { messageIds, messages, isResponding, appendMessage, setResponding } = useStore();
  const { isReplayMode } = useUIStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Convert agent store messages to array format for display
  const messageList = messageIds.map(id => messages.get(id)!).filter(Boolean);
  const messageCount = messageList.length;

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isResponding) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await sendMessage(content, { 
        abortSignal: abortController.signal,
        isReplayMode: isReplayMode 
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Chat error:", error);
        // Add error message
        const errorMessage: Message = {
          id: nanoid(),
          threadId: nanoid(),
          role: "assistant",
          content: "抱歉，发生了错误，请稍后重试。",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        appendMessage(errorMessage);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [isResponding, appendMessage, isReplayMode]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setResponding(false);
  }, [setResponding]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Chat Messages Area using MessageListView pattern */}
      <div className="flex-1 min-h-0 w-full">
        <ScrollContainer
          className={cn("flex flex-grow h-full w-full flex-col overflow-hidden")}
          autoScrollToBottom>
          <div className="space-y-6 py-4">
            {messageList.map((message) => (
              <MessageListItem
                key={message.id}
                message={message}
                onTabSwitch={onTabSwitch}
              />
            ))}

            {isResponding && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingAnimation size="sm" />
              </motion.div>
            )}
          </div>
        </ScrollContainer>
      </div>

      {/* Input Area */}
      <div className="relative flex h-42 shrink-0 pb-4">
        {!isResponding && messageCount === 0 && (
          <ConversationStarter
            className="absolute top-[-218px] left-0"
            onSend={handleSendMessage}
          />
        )}
        <InputBox
          className="h-full w-full"
          responding={isResponding}
          onSend={handleSendMessage}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}