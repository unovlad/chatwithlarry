import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatMessageTime } from "@/utils/timeFormat";
import { LarryIcon } from "./LarryIcon";

export function ChatMessageBubble(props: {
  message: Message;
  sources: any[];
  showTimestamp?: boolean;
  showAvatar?: boolean;
}) {
  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] flex`,
        props.message.role === "user"
          ? "bg-gray-200 text-secondary-foreground px-4 py-2"
          : null,
        props.message.role === "user" ? "ml-auto" : "mr-auto",
        props.showTimestamp ? "mb-8" : "mb-2",
      )}
    >
      {props.message.role !== "user" && props.showAvatar && (
        <div className="mr-4 border bg-background -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          <LarryIcon className="w-6 h-6" />
        </div>
      )}
      {props.message.role !== "user" && !props.showAvatar && (
        <div className="mr-4 w-10 h-10 flex-shrink-0"></div>
      )}

      <div className="flex flex-col">
        {props.message.role === "user" ? (
          <span className="whitespace-pre-wrap">{props.message.content}</span>
        ) : (
          <div className="prose prose-sm max-w-none bg-gray-200 px-2 py-3 rounded-lg">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mb-1">{children}</h3>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {props.message.content}
            </ReactMarkdown>
          </div>
        )}

        {props.sources && props.sources.length ? (
          <>
            <code className="mt-4 mr-auto bg-background px-2 py-1 rounded">
              <h2>🔍 Sources:</h2>
            </code>
            <code className="mt-1 mr-2 bg-background px-2 py-1 rounded text-xs">
              {props.sources?.map((source, i) => (
                <div className="mt-2" key={"source:" + i}>
                  {i + 1}. &quot;{source.pageContent}&quot;
                  {source.metadata?.loc?.lines !== undefined ? (
                    <div>
                      <br />
                      Lines {source.metadata?.loc?.lines?.from} to{" "}
                      {source.metadata?.loc?.lines?.to}
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </code>
          </>
        ) : null}

        {/* Timestamp */}
        {props.message.createdAt && props.showTimestamp && (
          <div
            className={cn(
              "text-xs text-gray-500 mt-2",
              props.message.role === "user" ? "text-right" : "text-left",
            )}
          >
            {formatMessageTime(props.message.createdAt)}
          </div>
        )}
      </div>
    </div>
  );
}
