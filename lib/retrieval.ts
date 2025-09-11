import retrievalSnippets from "@/data/retrieval_snippets.json";
import DEFAULT_RETRIEVAL_TEXT from "@/data/DefaultRetrievalText";

interface RetrievalSnippet {
  trigger: string[];
  response: string;
  category: string;
}

// Simple keyword matching for retrieval
export function findRelevantSnippet(userInput: string): string {
  const input = userInput.toLowerCase().trim();

  // Find the best matching snippet
  for (const snippet of retrievalSnippets as RetrievalSnippet[]) {
    for (const trigger of snippet.trigger) {
      // Check for exact word match or if input contains the trigger as a word
      const words = input.split(/\s+/);
      if (words.includes(trigger) || input === trigger) {
        return snippet.response;
      }
    }
  }

  // Fallback to default text if no match found
  return DEFAULT_RETRIEVAL_TEXT;
}

// Get all available categories
export function getAvailableCategories(): string[] {
  const categories = new Set<string>();
  (retrievalSnippets as RetrievalSnippet[]).forEach((snippet) => {
    categories.add(snippet.category);
  });
  return Array.from(categories);
}

// Get snippets by category
export function getSnippetsByCategory(category: string): RetrievalSnippet[] {
  return (retrievalSnippets as RetrievalSnippet[]).filter(
    (snippet) => snippet.category === category,
  );
}
