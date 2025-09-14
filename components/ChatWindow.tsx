"use client";

import { type Message } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect, useRef } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { IntermediateStep } from "./IntermediateStep";
import { TypingIndicator } from "./TypingIndicator";
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
import {
  getGuestSession,
  incrementGuestMessageCount,
  setGuestChatId,
  getRemainingMessages as getGuestRemainingMessages,
  isGuestSessionActive,
} from "@/lib/guestStorage";

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  className?: string;
  isLoading?: boolean;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  const prevMessagesLengthRef = useRef(0);

  // Функція для розбиття повідомлень на окремі бульбашки за параграфами
  const splitMessageByParagraphs = (message: Message): Message[] => {
    // Розбиваємо контент за подвійними переносами рядків (параграфи)
    const paragraphs = message.content.split("\n\n").filter((p) => p.trim());

    if (paragraphs.length <= 1) {
      return [message];
    }

    // Створюємо окремі повідомлення для кожного параграфа
    return paragraphs.map((paragraph, index) => ({
      ...message,
      id: `${message.id}-${index}`,
      content: paragraph.trim(),
    }));
  };

  // Розбиваємо всі повідомлення
  const processedMessages = props.messages.flatMap(splitMessageByParagraphs);

  // Автоскрол при додаванні нових повідомлень
  useEffect(() => {
    const currentMessagesLength = processedMessages.length;

    if (currentMessagesLength > prevMessagesLengthRef.current) {
      // Є нові повідомлення, скролимо вниз
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }

    prevMessagesLengthRef.current = currentMessagesLength;
  }, [processedMessages.length, scrollToBottom]);

  // Автоскрол коли зникає TypingIndicator
  useEffect(() => {
    if (!props.isLoading) {
      // TypingIndicator зник, скролимо вниз
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [props.isLoading, scrollToBottom]);

  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-2 w-full">
      {processedMessages.map((m, i) => {
        if (m.role === "system") {
          return <IntermediateStep key={m.id} message={m} />;
        }

        const sourceKey = (props.messages.length - 1 - i).toString();

        // Перевіряємо чи це останній параграф в серії повідомлень від того ж відправника
        const isLastInSeries =
          i === processedMessages.length - 1 ||
          processedMessages[i + 1]?.role !== m.role;

        // Перевіряємо чи це перший параграф в серії повідомлень від того ж відправника
        const isFirstInSeries =
          i === 0 || processedMessages[i - 1]?.role !== m.role;

        return (
          <ChatMessageBubble
            key={m.id}
            message={m}
            sources={props.sourcesForMessages[sourceKey]}
            showTimestamp={isLastInSeries}
            showAvatar={isFirstInSeries}
          />
        );
      })}
      {props.isLoading && <TypingIndicator />}
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
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
  sessionId?: string;
  isGuestChat?: boolean;
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
    loading: authLoading,
    canSendMessage,
    incrementMessageCount,
    createChat,
    saveMessage,
    getRemainingMessages,
    loadMessages,
  } = useAuth();

  const [showAuthCTA, setShowAuthCTA] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [guestSession, setGuestSession] = useState(getGuestSession());
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    console.log(
      "ChatWindow useEffect - sessionId:",
      props.sessionId,
      "isGuestChat:",
      props.isGuestChat,
    );

    // Якщо це гостьовий чат, встановлюємо chatId в localStorage
    if (props.isGuestChat && props.sessionId) {
      console.log("Setting guest chat ID:", props.sessionId);
      setGuestChatId(props.sessionId);
      setCurrentChatId(props.sessionId);
    } else if (props.sessionId) {
      console.log("Setting regular chat ID:", props.sessionId);
      setCurrentChatId(props.sessionId);
    }
  }, [props.sessionId, props.isGuestChat]);

  const chat = useChat({
    api: props.endpoint,
    body: {
      chatId: currentChatId,
    },
    onResponse(response) {
      // Приховуємо typing indicator коли починаємо отримувати відповідь
      setIsWaitingForResponse(false);

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

      // Приховуємо typing indicator при помилці
      setIsWaitingForResponse(false);

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
    onFinish: async (message) => {
      // Приховуємо typing indicator коли відповідь завершена
      setIsWaitingForResponse(false);

      // Визначаємо chatId для збереження
      const chatIdForSave =
        currentChatId || (user && props.sessionId ? props.sessionId : null);

      console.log(
        "onFinish called - user:",
        !!user,
        "currentChatId:",
        currentChatId,
        "chatIdForSave:",
        chatIdForSave,
        "isGuestChat:",
        props.isGuestChat,
      );

      // Зберігаємо відповідь асистента в БД
      if (chatIdForSave) {
        try {
          console.log("Saving assistant message to database:", message.content);
          if (user) {
            // Для авторизованих користувачів
            await saveMessage(chatIdForSave, "assistant", message.content);
          } else if (props.isGuestChat) {
            // Для гостьових сесій - зберігаємо через guest service
            const { addGuestMessage } = await import("@/lib/guestService");
            await addGuestMessage(chatIdForSave, message.content, "assistant");
          }
          console.log("Assistant message saved successfully to database");
        } catch (error) {
          console.error("Error saving assistant message to database:", error);
        }
      } else {
        console.log(
          "Not saving to database - user:",
          !!user,
          "chatIdForSave:",
          chatIdForSave,
        );
      }
    },
  });

  // Автоскрол при зміні повідомлень
  useEffect(() => {
    if (chat.messages.length > 0) {
      // Невелика затримка для того, щоб DOM оновився
      setTimeout(() => {
        // Використовуємо StickToBottom компонент для скролу
        const scrollContainer = document.querySelector(
          "[data-stick-to-bottom]",
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 100);
    }
  }, [chat.messages.length]);

  // Завантажуємо існуючий чат або відправляємо початкове повідомлення
  useEffect(() => {
    // Очікуємо завершення авторизації перед завантаженням
    if (isHydrated && !authLoading && chat.messages.length === 0) {
      console.log(
        "Loading chat - user:",
        !!user,
        "authLoading:",
        authLoading,
        "sessionId:",
        props.sessionId,
        "isGuestChat:",
        props.isGuestChat,
        "currentChatId:",
        currentChatId,
      );

      if (props.sessionId) {
        // Тепер sessionId - це UUID чату з БД, доступ перевірено на сервері
        if (user) {
          // Завантажуємо з БД для авторизованих користувачів
          console.log("Loading from database for chatId:", props.sessionId);
          loadChatFromDatabase();
        } else if (props.isGuestChat) {
          // Завантажуємо з БД для гостьових сесій
          console.log(
            "Loading guest chat from database for chatId:",
            props.sessionId,
          );
          loadGuestChatFromDatabase();
        }
      } else {
        console.log("No sessionId provided");
      }
    }
  }, [
    props.sessionId,
    props.isGuestChat,
    chat.messages.length,
    chat,
    isHydrated,
    authLoading,
    user,
    currentChatId,
  ]);

  const loadChatFromDatabase = async () => {
    if (!user || !props.sessionId) return;

    try {
      console.log("Loading chat from database:", props.sessionId);
      const messages = await loadMessages(props.sessionId);

      if (messages && messages.length > 0) {
        console.log("Found messages in database:", messages.length);
        // Конвертуємо повідомлення з БД в формат Vercel AI
        const vercelMessages = messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at),
        }));
        chat.setMessages(vercelMessages);
        setCurrentChatId(props.sessionId);

        // Перевіряємо чи останнє повідомлення від користувача (без відповіді AI)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
          console.log("Last message is from user, sending to AI...");
          // Відправляємо запит до AI для отримання відповіді
          setTimeout(() => {
            chat.reload();
          }, 100);
        }
        return;
      } else {
        console.log("No messages found in database for chat:", props.sessionId);
        // Якщо чат існує, але немає повідомлень, встановлюємо currentChatId
        setCurrentChatId(props.sessionId);
      }
    } catch (error) {
      console.error("Error loading chat from database:", error);
      // Для помилок просто встановлюємо currentChatId
      setCurrentChatId(props.sessionId);
    }
  };

  const loadGuestChatFromDatabase = async () => {
    if (!props.sessionId) return;

    try {
      console.log("Loading guest chat from database:", props.sessionId);
      const { getGuestChatMessages } = await import("@/lib/guestService");
      const messages = await getGuestChatMessages(props.sessionId);

      console.log("Raw messages from database:", messages);

      if (messages && messages.length > 0) {
        console.log("Found guest messages in database:", messages.length);
        // Конвертуємо повідомлення з БД в формат Vercel AI
        const vercelMessages = messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at),
        }));
        console.log("Converted messages for chat:", vercelMessages);
        chat.setMessages(vercelMessages);
        setCurrentChatId(props.sessionId);

        // Перевіряємо чи останнє повідомлення від користувача (без відповіді AI)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
          console.log("Last guest message is from user, sending to AI...");
          // Відправляємо запит до AI для отримання відповіді
          setTimeout(() => {
            chat.reload();
          }, 100);
        }
        return;
      } else {
        console.log(
          "No guest messages found in database for chat:",
          props.sessionId,
        );
        // Якщо чат існує, але немає повідомлень, встановлюємо currentChatId
        setCurrentChatId(props.sessionId);
      }
    } catch (error) {
      console.error("Error loading guest chat from database:", error);
      // Для помилок просто встановлюємо currentChatId
      setCurrentChatId(props.sessionId);
    }
  };

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (chat.isLoading || intermediateStepsLoading) return;

    // Перевіряємо ліміт повідомлень
    let canSend = false;
    if (user) {
      canSend = canSendMessage();
    } else if (props.isGuestChat) {
      // Для гостьових сесій перевіряємо localStorage
      const updatedGuestSession = getGuestSession();
      canSend = updatedGuestSession.canSendMessage;
      setGuestSession(updatedGuestSession);
    } else {
      canSend = true; // Для нових користувачів без сесії
    }

    if (!canSend) {
      setShowAuthCTA(true);
      toast.error(
        "You've reached the limit of messages. Please sign up to continue.",
      );
      return;
    }

    // Встановлюємо chatId - тепер чат вже створений через Server Action
    let chatId = currentChatId;
    if (user && props.sessionId && !chatId) {
      // Якщо користувач залогінений і є sessionId (UUID чату), встановлюємо його
      chatId = props.sessionId;
      setCurrentChatId(chatId);
      console.log("Set currentChatId from sessionId:", chatId);
    } else if (props.isGuestChat && props.sessionId && !chatId) {
      chatId = props.sessionId;
      setCurrentChatId(chatId);
    }

    // Збільшуємо лічильник повідомлень
    if (user) {
      incrementMessageCount();
    } else if (props.isGuestChat) {
      incrementGuestMessageCount();
      setGuestSession(getGuestSession());
    }

    if (!showIntermediateSteps) {
      // Зберігаємо повідомлення користувача в БД перед відправкою
      if (chatId) {
        try {
          console.log(
            "Saving user message to database:",
            chat.input,
            "chatId:",
            chatId,
            "isGuestChat:",
            props.isGuestChat,
          );
          if (user) {
            await saveMessage(chatId, "user", chat.input);
          } else if (props.isGuestChat) {
            const { addGuestMessage } = await import("@/lib/guestService");
            await addGuestMessage(chatId, chat.input, "user");
            console.log("Guest user message saved successfully");
          }
        } catch (error) {
          console.error("Error saving user message:", error);
        }
      } else {
        console.log("No chatId available for saving user message");
      }

      // Показуємо typing indicator перед відправкою
      setIsWaitingForResponse(true);
      chat.handleSubmit(e);
      return;
    }

    // Some extra work to show intermediate steps properly
    setIntermediateStepsLoading(true);

    // Зберігаємо повідомлення користувача в БД
    if (chatId) {
      try {
        console.log("Saving user message to database:", chat.input);
        if (user) {
          await saveMessage(chatId, "user", chat.input);
        } else if (props.isGuestChat) {
          const { addGuestMessage } = await import("@/lib/guestService");
          await addGuestMessage(chatId, chat.input, "user");
        }
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    }

    chat.setInput("");
    const messagesWithUserReply = chat.messages.concat({
      id: chat.messages.length.toString(),
      content: chat.input,
      role: "user",
      createdAt: new Date(),
    });
    chat.setMessages(messagesWithUserReply);

    // Показуємо typing indicator перед відправкою
    setIsWaitingForResponse(true);

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
        createdAt: new Date(),
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
                messages={chat.messages}
                emptyStateComponent={props.emptyStateComponent}
                sourcesForMessages={sourcesForMessages}
                isLoading={isWaitingForResponse}
              />
              <div className="">
                <AuthCTA
                  remainingMessages={
                    user
                      ? getRemainingMessages()
                      : props.isGuestChat
                        ? getGuestRemainingMessages()
                        : 0
                  }
                />
              </div>
            </div>
          ) : chat.messages.length === 0 ? (
            <div>{props.emptyStateComponent}</div>
          ) : (
            <ChatMessages
              messages={chat.messages}
              emptyStateComponent={props.emptyStateComponent}
              sourcesForMessages={sourcesForMessages}
              isLoading={isWaitingForResponse}
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
            {!showAuthCTA && isHydrated && (
              <>
                {user && user.subscription_plan === "free" && (
                  <div className="text-xs text-gray-500">
                    {getRemainingMessages()} free message
                    {getRemainingMessages() === 1 ? "" : "s"} remaining
                  </div>
                )}
                {props.isGuestChat && !user && (
                  <div className="text-xs text-gray-500">
                    {getGuestRemainingMessages()} guest message
                    {getGuestRemainingMessages() === 1 ? "" : "s"} remaining
                  </div>
                )}
              </>
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
