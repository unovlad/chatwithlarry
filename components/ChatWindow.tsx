"use client";

import { type Message } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { IntermediateStep } from "./IntermediateStep";
import { Button } from "./ui/button";
import { ArrowDown, LoaderCircle, Paperclip } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { UploadDocumentsForm } from "./UploadDocumentsForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "@/utils/cn";
import { AuthCTA } from "./AuthCTA";
import { useAuth } from "@/contexts/AuthContext";
import type { Chat, Message as DBMessage } from "@/types/user";

// Функція для збереження чату в localStorage
function saveChatToStorage(
  sessionId: string,
  messages: Message[],
  lastMessage: string,
) {
  try {
    const chatData = {
      id: sessionId,
      title:
        messages.length > 0
          ? messages[0].content.slice(0, 50) + "..."
          : "New Chat",
      createdAt: new Date().toISOString(),
      lastMessage: lastMessage,
      messages: messages,
    };

    const existingChats = localStorage.getItem("larry-chats");
    const chats = existingChats ? JSON.parse(existingChats) : [];

    // Оновлюємо існуючий чат або додаємо новий
    const existingIndex = chats.findIndex((chat: any) => chat.id === sessionId);
    if (existingIndex >= 0) {
      chats[existingIndex] = chatData;
    } else {
      chats.unshift(chatData); // Додаємо на початок списку
    }

    // Зберігаємо тільки останні 50 чатів
    const limitedChats = chats.slice(0, 50);
    localStorage.setItem("larry-chats", JSON.stringify(limitedChats));
  } catch (error) {
    console.error("Error saving chat to storage:", error);
  }
}

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] bg-gray-100 mx-auto pb-12 w-full">
      {props.messages.map((m, i) => {
        if (m.role === "system") {
          return <IntermediateStep key={m.id} message={m} />;
        }

        const sourceKey = (props.messages.length - 1 - i).toString();
        return (
          <ChatMessageBubble
            key={m.id}
            message={m}
            aiEmoji={props.aiEmoji}
            sources={props.sourcesForMessages[sourceKey]}
          />
        );
      })}
    </div>
  );
}

export function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  const disabled = props.loading && props.onStop == null;
  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();

        if (props.loading) {
          props.onStop?.();
        } else {
          props.onSubmit(e);
        }
      }}
      className={cn("flex w-full flex-col", props.className)}
    >
      <div className="border border-input bg-background rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          className="border-none outline-none bg-transparent p-4"
        />

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3">{props.children}</div>

          <div className="flex gap-2 self-end">
            {props.actions}
            <Button type="submit" className="self-end" disabled={disabled}>
              {props.loading ? (
                <span role="status" className="flex justify-center">
                  <LoaderCircle className="animate-spin" />
                  <span className="sr-only">Loading...</span>
                </span>
              ) : (
                <span>Send</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  // scrollRef will also switch between overflow: unset to overflow: auto
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={cn("grid grid-rows-[1fr,auto]", props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatLayout(props: { content: ReactNode; footer: ReactNode }) {
  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={props.content}
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            {props.footer}
          </div>
        }
      />
    </StickToBottom>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent?: ReactNode;
  placeholder?: string;
  emoji?: string;
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
  initialMessage?: string;
  sessionId?: string;
}) {
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(
    !!props.showIntermediateStepsToggle,
  );
  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const {
    user,
    canSendMessage,
    incrementMessageCount,
    createChat,
    saveMessage,
    getRemainingMessages,
  } = useAuth();

  const [showAuthCTA, setShowAuthCTA] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show AuthCTA if user reaches limit and has initial message
  useEffect(() => {
    if (isHydrated && props.initialMessage && !canSendMessage()) {
      setShowAuthCTA(true);
    }
  }, [isHydrated, props.initialMessage, canSendMessage]);

  const chat = useChat({
    api: props.endpoint,
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];

      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamMode: "text",
    onError: (e) => {
      console.error("Chat error:", e);

      // Handle specific error types
      if (e.message?.includes("Connection interrupted")) {
        toast.error("Connection lost", {
          description: "Please try again in a moment.",
        });
      } else if (e.message?.includes("Rate limit")) {
        toast.error("Too many requests", {
          description: "Please wait a moment before trying again.",
        });
      } else {
        toast.error("Something went wrong", {
          description: "Please try again.",
        });
      }
    },
    onFinish: (message) => {
      // Зберігаємо чат в localStorage
      if (props.sessionId) {
        saveChatToStorage(props.sessionId, chat.messages, message.content);
      }
    },
  });

  // Завантажуємо існуючий чат або відправляємо початкове повідомлення
  useEffect(() => {
    if (isHydrated && chat.messages.length === 0) {
      if (props.sessionId) {
        // Завантажуємо існуючий чат
        const existingChats = localStorage.getItem("larry-chats");
        if (existingChats) {
          try {
            const chats = JSON.parse(existingChats);
            const existingChat = chats.find(
              (chat: any) => chat.id === props.sessionId,
            );
            if (existingChat && existingChat.messages) {
              chat.setMessages(existingChat.messages);
              return;
            }
          } catch (error) {
            console.error("Error loading existing chat:", error);
          }
        }

        // Перевіряємо чи є збережене початкове повідомлення для цієї сесії
        const initialMessageKey = `larry-initial-message-${props.sessionId}`;
        const savedInitialMessage = localStorage.getItem(initialMessageKey);

        if (savedInitialMessage) {
          // Видаляємо збережене повідомлення, оскільки воно вже використане
          localStorage.removeItem(initialMessageKey);

          const timer = setTimeout(() => {
            chat.append({
              role: "user",
              content: savedInitialMessage,
            });
          }, 100);

          return () => clearTimeout(timer);
        }
      }

      // Відправляємо початкове повідомлення з пропсів, якщо воно є
      if (props.initialMessage) {
        const timer = setTimeout(() => {
          if (props.initialMessage) {
            chat.append({
              role: "user",
              content: props.initialMessage,
            });
          }
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [
    props.initialMessage,
    props.sessionId,
    chat.messages.length,
    chat,
    isHydrated,
  ]);

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (chat.isLoading || intermediateStepsLoading) return;

    // Перевіряємо ліміт повідомлень
    if (!canSendMessage()) {
      setShowAuthCTA(true);
      toast.error(
        "You've reached the limit of messages. Please sign up to continue.",
      );
      return;
    }

    // Збільшуємо лічильник повідомлень
    incrementMessageCount();

    if (!showIntermediateSteps) {
      chat.handleSubmit(e);
      return;
    }

    // Some extra work to show intermediate steps properly
    setIntermediateStepsLoading(true);

    chat.setInput("");
    const messagesWithUserReply = chat.messages.concat({
      id: chat.messages.length.toString(),
      content: chat.input,
      role: "user",
    });
    chat.setMessages(messagesWithUserReply);

    const response = await fetch(props.endpoint, {
      method: "POST",
      body: JSON.stringify({
        messages: messagesWithUserReply,
        show_intermediate_steps: true,
      }),
    });
    const json = await response.json();
    setIntermediateStepsLoading(false);

    if (!response.ok) {
      toast.error(`Error while processing your request`, {
        description: json.error,
      });
      return;
    }

    const responseMessages: Message[] = json.messages;

    // Represent intermediate steps as system messages for display purposes
    // TODO: Add proper support for tool messages
    const toolCallMessages = responseMessages.filter(
      (responseMessage: Message) => {
        return (
          (responseMessage.role === "assistant" &&
            !!responseMessage.tool_calls?.length) ||
          responseMessage.role === "tool"
        );
      },
    );

    const intermediateStepMessages = [];
    for (let i = 0; i < toolCallMessages.length; i += 2) {
      const aiMessage = toolCallMessages[i];
      const toolMessage = toolCallMessages[i + 1];
      intermediateStepMessages.push({
        id: (messagesWithUserReply.length + i / 2).toString(),
        role: "system" as const,
        content: JSON.stringify({
          action: aiMessage.tool_calls?.[0],
          observation: toolMessage.content,
        }),
      });
    }
    const newMessages = messagesWithUserReply;
    for (const message of intermediateStepMessages) {
      newMessages.push(message);
      chat.setMessages([...newMessages]);
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000),
      );
    }

    chat.setMessages([
      ...newMessages,
      {
        id: newMessages.length.toString(),
        content: responseMessages[responseMessages.length - 1].content,
        role: "assistant",
      },
    ]);
  }

  return (
    <div className="flex flex-col h-full p-4">
      <ChatLayout
        content={
          showAuthCTA && isHydrated ? (
            <div className="flex flex-col max-w-[768px] mx-auto pb-6 w-full">
              <ChatMessages
                aiEmoji={props.emoji}
                messages={chat.messages}
                emptyStateComponent={props.emptyStateComponent}
                sourcesForMessages={sourcesForMessages}
              />
              <div className="">
                <AuthCTA remainingMessages={getRemainingMessages()} />
              </div>
            </div>
          ) : chat.messages.length === 0 && !props.initialMessage ? (
            <div>{props.emptyStateComponent}</div>
          ) : (
            <ChatMessages
              aiEmoji={props.emoji}
              messages={chat.messages}
              emptyStateComponent={props.emptyStateComponent}
              sourcesForMessages={sourcesForMessages}
            />
          )
        }
        footer={
          <ChatInput
            value={chat.input}
            onChange={chat.handleInputChange}
            onSubmit={sendMessage}
            loading={chat.isLoading || intermediateStepsLoading}
            placeholder={props.placeholder ?? "What's it like to be a pirate?"}
          >
            {!showAuthCTA &&
              isHydrated &&
              user &&
              user.subscription_plan === "free" && (
                <div className="text-xs text-gray-500">
                  {getRemainingMessages()} free message
                  {getRemainingMessages() === 1 ? "" : "s"} remaining
                </div>
              )}
            {props.showIngestForm && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="pl-2 pr-3 -ml-2"
                    disabled={chat.messages.length !== 0}
                  >
                    <Paperclip className="size-4" />
                    <span>Upload document</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload document</DialogTitle>
                    <DialogDescription>
                      Upload a document to use for the chat.
                    </DialogDescription>
                  </DialogHeader>
                  <UploadDocumentsForm />
                </DialogContent>
              </Dialog>
            )}

            {props.showIntermediateStepsToggle && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show_intermediate_steps"
                  name="show_intermediate_steps"
                  checked={showIntermediateSteps}
                  disabled={chat.isLoading || intermediateStepsLoading}
                  onCheckedChange={(e) => setShowIntermediateSteps(!!e)}
                />
                <label htmlFor="show_intermediate_steps" className="text-sm">
                  Show intermediate steps
                </label>
              </div>
            )}
          </ChatInput>
        }
      />
    </div>
  );
}
