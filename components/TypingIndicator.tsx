import { cn } from "@/utils/cn";

export function TypingIndicator(props: {
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] max-w-[80%] mb-8 flex mr-auto",
        props.className,
      )}
    >
      <div className="mr-4 border bg-background -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
        {props.aiEmoji || "✈️"}
      </div>

      <div className="flex items-center space-x-1 bg-gray-100 rounded-2xl px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
