"use client";

import { type Message } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { IntermediateStep } from "./IntermediateStep";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "./ui/button";
import { ArrowDown, LoaderCircle, Paperclip, Send } from "lucide-react";
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
import { useRouter } from "next/navigation";
import type { Chat, Message as DBMessage } from "@/types/user";

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  className?: string;
  isLoading?: boolean;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  const prevMessagesLengthRef = useRef(0);

  // Function to split messages into separate bubbles by paragraphs
  const splitMessageByParagraphs = (message: Message): Message[] => {
    // Split content by double line breaks (paragraphs)
    const paragraphs = message.content.split("\n\n").filter((p) => p.trim());

    if (paragraphs.length <= 1) {
      return [message];
    }

    // Check if this is a numbered list (starts with "1. ")
    const isNumberedList = paragraphs.some((p) => p.trim().match(/^\d+\.\s/));

    // If this is a numbered list, don't split it
    if (isNumberedList) {
      return [message];
    }

    // Create separate messages for each paragraph
    return paragraphs.map((paragraph, index) => ({
      ...message,
      id: `${message.id}-${index}`,
      content: paragraph.trim(),
    }));
  };

  // Split all messages
  const processedMessages = props.messages.flatMap(splitMessageByParagraphs);

  // Filter duplicates of first user message
  const filteredMessages = useMemo(() => {
    if (processedMessages.length < 2) return processedMessages;

    const firstMessage = processedMessages[0];
    const secondMessage = processedMessages[1];

    // If first two user messages are identical, hide the first one
    if (
      firstMessage.role === "user" &&
      secondMessage.role === "user" &&
      firstMessage.content === secondMessage.content
    ) {
      return processedMessages.slice(1);
    }

    return processedMessages;
  }, [processedMessages]);

  // Auto-scroll when adding new messages
  useEffect(() => {
    const currentMessagesLength = filteredMessages.length;

    if (currentMessagesLength > prevMessagesLengthRef.current) {
      // There are new messages, scroll down
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }

    prevMessagesLengthRef.current = currentMessagesLength;
  }, [filteredMessages.length, scrollToBottom]);

  // Additional auto-scroll when messages change (in case length doesn't change)
  useEffect(() => {
    if (filteredMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [filteredMessages, scrollToBottom]);

  // Auto-scroll when message content changes (streaming)
  const prevContentRef = useRef("");
  useEffect(() => {
    const currentContent = filteredMessages.map((m) => m.content).join("");

    if (
      currentContent !== prevContentRef.current &&
      prevContentRef.current !== ""
    ) {
      // Content changed (streaming), scroll down
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }

    prevContentRef.current = currentContent;
  }, [filteredMessages, scrollToBottom]);

  // Auto-scroll when TypingIndicator disappears
  useEffect(() => {
    if (!props.isLoading) {
      // TypingIndicator disappeared, scroll down
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [props.isLoading, scrollToBottom]);

  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-2 w-full">
      {filteredMessages.map((m, i) => {
        if (m.role === "system") {
          return <IntermediateStep key={m.id} message={m} />;
        }

        const sourceKey = (props.messages.length - 1 - i).toString();

        // Check if this is the last paragraph in a series of messages from the same sender
        const isLastInSeries =
          i === filteredMessages.length - 1 ||
          filteredMessages[i + 1]?.role !== m.role;

        // Check if this is the first paragraph in a series of messages from the same sender
        const isFirstInSeries =
          i === 0 || filteredMessages[i - 1]?.role !== m.role;

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
      <div className="border border-input bg-background rounded-lg flex items-center gap-2 max-w-[768px] w-full mx-auto p-2">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          className="flex-1 border-none outline-none bg-transparent px-3 py-1"
        />
        {props.children}
        {props.actions}
        <Button type="submit" disabled={disabled || !props.value.trim()}>
          {props.loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
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
        className="h-full"
        contentClassName="py-8 px-2 pb-32"
        content={props.content}
        footer={
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 z-10">
            <div className="max-w-[768px] mx-auto">
              <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
              {props.footer}
            </div>
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
  const router = useRouter();

  const [showAuthCTA, setShowAuthCTA] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [hasLoadedChat, setHasLoadedChat] = useState(false);
  const [hasSentAutoMessage, setHasSentAutoMessage] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    console.log("ChatWindow useEffect - sessionId:", props.sessionId);
  }, [props.sessionId]);

  // Redirect for unauthenticated users
  useEffect(() => {
    if (isHydrated && !authLoading && !user) {
      console.log("ChatWindow: User not authenticated, redirecting to /");
      router.push("/");
    }
  }, [isHydrated, authLoading, user, router]);

  // Set chatId
  useEffect(() => {
    if (props.sessionId) {
      console.log("Setting chat ID:", props.sessionId);
      setCurrentChatId(props.sessionId);
    }
  }, [props.sessionId]);

  // Stabilize useChat parameters
  const chatConfig = useMemo(
    () => ({
      api: props.endpoint,
      body: {
        chatId: currentChatId || props.sessionId,
      },
      id: currentChatId || props.sessionId,
    }),
    [props.endpoint, currentChatId, props.sessionId],
  );

  const handleResponse = useCallback((response: Response) => {
    // Hide typing indicator when starting to receive response
    setIsWaitingForResponse(false);

    const sourcesHeader = response.headers.get("x-sources");
    const sources = sourcesHeader
      ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
      : [];

    const messageIndexHeader = response.headers.get("x-message-index");
    if (sources.length && messageIndexHeader !== null) {
      setSourcesForMessages((prev) => ({
        ...prev,
        [messageIndexHeader]: sources,
      }));
    }
  }, []);

  const handleError = useCallback((e: Error) => {
    console.error("Chat error:", e);

    // Hide typing indicator on error
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
  }, []);

  const handleFinish = useCallback(
    async (message: any) => {
      // Hide typing indicator when response is complete
      setIsWaitingForResponse(false);

      // Determine chatId for saving
      const chatIdForSave =
        currentChatId || (user && props.sessionId ? props.sessionId : null);

      console.log(
        "onFinish called - user:",
        !!user,
        "currentChatId:",
        currentChatId,
        "chatIdForSave:",
        chatIdForSave,
        "message content length:",
        message.content.length,
      );

      // Save assistant response to database
      if (chatIdForSave && user) {
        try {
          console.log("Saving assistant message to database:", message.content);
          await saveMessage(chatIdForSave, "assistant", message.content);
          console.log("Assistant message saved successfully to database");

          // Deduct tokens after successfully receiving response
          console.log("Deducting tokens after receiving assistant response");
          try {
            await incrementMessageCount();
            console.log("Tokens deducted successfully");
          } catch (error) {
            console.error("Error deducting tokens:", error);
            toast.error(
              "Failed to update message count. Please refresh the page.",
            );
          }
        } catch (error) {
          console.error("Error saving assistant message to database:", error);
          // Don't deduct tokens if message couldn't be saved
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
    [currentChatId, user, props.sessionId, saveMessage, incrementMessageCount],
  );

  const chat = useChat({
    ...chatConfig,
    onResponse: handleResponse,
    streamMode: "text",
    onError: handleError,
    onFinish: handleFinish,
  });

  const loadChatFromDatabase = useCallback(async () => {
    console.log(
      "loadChatFromDatabase called - user:",
      !!user,
      "sessionId:",
      props.sessionId,
    );
    if (!user || !props.sessionId) {
      console.log("loadChatFromDatabase: Missing user or sessionId, returning");
      return;
    }

    try {
      console.log("Loading chat from database:", props.sessionId);

      // First try to load via API
      let messages = [];
      try {
        console.log("Trying to load messages via API...");
        const response = await fetch(`/api/chat/${props.sessionId}/messages`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const { messages: apiMessages } = await response.json();
          messages = apiMessages;
          console.log("Messages loaded via API:", messages.length);
        } else {
          console.log("API failed, falling back to loadMessages...");
          messages = await loadMessages(props.sessionId);
        }
      } catch (apiError) {
        console.log("API error, falling back to loadMessages:", apiError);
        messages = await loadMessages(props.sessionId);
      }

      console.log("Messages loaded from database:", messages?.length || 0);

      if (messages && messages.length > 0) {
        console.log("Found messages in database:", messages.length);
        // Convert messages from DB to Vercel AI format
        const vercelMessages = messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at),
        }));
        chat.setMessages(vercelMessages);
        setCurrentChatId(props.sessionId);

        // Check if last message is from user (without AI response)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user" && !hasSentAutoMessage) {
          console.log(
            "Last message is from user, sending to AI for response...",
          );
          setHasSentAutoMessage(true);
          // Send request to AI to get response
          setTimeout(async () => {
            try {
              console.log("Sending auto-message to AI:", lastMessage.content);
              // Send message directly via append
              await chat.append({
                role: "user",
                content: lastMessage.content,
              });
              console.log("Auto-message sent successfully");
            } catch (error) {
              console.error("Error sending message to AI:", error);
            }
          }, 100);
        } else {
          console.log("Chat loaded from database, ready for user interaction");
        }
        return;
      } else {
        console.log("No messages found in database for chat:", props.sessionId);
        // If chat exists but has no messages, set currentChatId
        setCurrentChatId(props.sessionId);
      }
    } catch (error) {
      console.error("Error loading chat from database:", error);
      // For errors just set currentChatId and show empty chat
      console.log("Setting currentChatId despite error:", props.sessionId);
      setCurrentChatId(props.sessionId);
    }
  }, [user, props.sessionId, hasSentAutoMessage, chat, loadMessages]);

  // Load existing chat only once
  useEffect(() => {
    // Load chat only once after authentication
    if (
      isHydrated &&
      !authLoading &&
      user &&
      props.sessionId &&
      !hasLoadedChat
    ) {
      console.log("Loading chat from database for chatId:", props.sessionId);
      setHasLoadedChat(true);
      loadChatFromDatabase();
    }
  }, [
    isHydrated,
    authLoading,
    user,
    props.sessionId,
    hasLoadedChat,
    loadChatFromDatabase,
  ]);

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (chat.isLoading || intermediateStepsLoading) return;

    // Check if user is authenticated
    if (!user) {
      toast.error("Please sign in to continue the conversation.");
      return;
    }

    // Check message limit
    if (!canSendMessage()) {
      setShowAuthCTA(true);
      toast.error(
        "You've reached the limit of messages. Please sign up to continue.",
      );
      return;
    }

    // Set chatId - chat is now created through Server Action
    let chatId = currentChatId;
    if (user && props.sessionId && !chatId) {
      // If user is logged in and has sessionId (chat UUID), set it
      chatId = props.sessionId;
      setCurrentChatId(chatId);
      console.log("Set currentChatId from sessionId:", chatId);
    }

    // Tokens will be deducted after receiving response from assistant

    if (!showIntermediateSteps) {
      // Save user message to database before sending
      if (chatId) {
        try {
          console.log(
            "Saving user message to database:",
            chat.input,
            "chatId:",
            chatId,
          );
          await saveMessage(chatId, "user", chat.input);
        } catch (error) {
          console.error("Error saving user message:", error);
        }
      } else {
        console.log("No chatId available for saving user message");
      }

      // Show typing indicator before sending
      setIsWaitingForResponse(true);
      console.log("Sending user message via handleSubmit:", chat.input);
      chat.handleSubmit(e);
      // Clear input after sending
      chat.setInput("");

      // Auto-scroll after sending message will be handled in ChatMessages

      return;
    }

    // Some extra work to show intermediate steps properly
    setIntermediateStepsLoading(true);

    // Save user message to database
    if (chatId) {
      try {
        console.log("Saving user message to database:", chat.input);
        await saveMessage(chatId, "user", chat.input);
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    }

    const userMessage = chat.input;
    chat.setInput("");
    const messagesWithUserReply = chat.messages.concat({
      id: chat.messages.length.toString(),
      content: userMessage,
      role: "user",
      createdAt: new Date(),
    });
    chat.setMessages(messagesWithUserReply);

    // Auto-scroll after adding user message will be handled in ChatMessages

    // Show typing indicator before sending
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

    // Save assistant response to database
    if (chatId) {
      try {
        console.log(
          "Saving assistant message to database (intermediate steps):",
          responseMessages[responseMessages.length - 1].content,
        );
        await saveMessage(
          chatId,
          "assistant",
          responseMessages[responseMessages.length - 1].content,
        );
        console.log("Assistant message saved successfully to database");

        // Deduct tokens after successfully receiving response with intermediate steps
        console.log(
          "ChatWindow: Deducting tokens after receiving assistant response with intermediate steps",
        );
        try {
          await incrementMessageCount();
          console.log("ChatWindow: Tokens deducted successfully");
        } catch (error) {
          console.error("ChatWindow: Error deducting tokens:", error);
          toast.error(
            "Failed to update message count. Please refresh the page.",
          );
        }
      } catch (error) {
        console.error("Error saving assistant message to database:", error);
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
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
                  remainingMessages={getRemainingMessages()}
                  context="limit"
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
            placeholder={props.placeholder ?? "Chat with Larry..."}
          >
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
