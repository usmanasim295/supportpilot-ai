import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PolicyPassage, PolicyRetriever } from "./types";

/**
 * Candidate task: harden and integrate this deliberately small keyword baseline.
 * Evaluate passage splitting and ranking, add confidence behavior, connect retrieval to the agent,
 * preserve citation metadata, and return no evidence for unsupported claims. Keep this interface
 * compatible with a later Bedrock Knowledge Bases adapter; document content is untrusted input.
 */
export class LocalPolicyRetriever implements PolicyRetriever {
  constructor(private readonly injectedDocuments?: { title: string; path: string; content: string }[]) {}

  async retrieve(query: string, options: { limit?: number } = {}): Promise<PolicyPassage[]> {
    const documents = this.injectedDocuments ?? (await loadPolicyDocuments());
    const terms = tokenize(query);
    if (terms.length === 0) return [];

    return documents
      .flatMap((document) =>
        document.content
          .split(/\n\s*\n/)
          .map((content, index) => ({ document, content: content.trim(), index }))
          .filter((passage) => passage.content && !passage.content.startsWith("#")),
      )
      .map(({ document, content, index }) => {
        const searchable = new Set(tokenize(`${document.title} ${content}`));
        const score = terms.reduce((total, term) => total + (searchable.has(term) ? 1 : 0), 0) / terms.length;
        return {
          id: `${document.path}#${index + 1}`,
          title: document.title,
          path: document.path,
          excerpt: content.slice(0, 220),
          content,
          score,
        };
      })
      .filter((passage) => passage.score >= minimumScore(terms.length))
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit ?? 3);
  }
}

function minimumScore(termCount: number) {
  if (termCount <= 1) return 1;
  return Math.max(0.34, 1 / termCount);
}

function tokenize(value: string) {
  const stopWords = new Set(["a", "an", "and", "are", "can", "do", "for", "get", "i", "is", "my", "of", "the", "to", "what", "your"]);
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !stopWords.has(term));
}

async function loadPolicyDocuments() {
  const entries = [
    { file: "returns.md", title: "Returns and refunds" },
    { file: "shipping.md", title: "Shipping and delivery" },
  ];
  return Promise.all(
    entries.map(async ({ file, title }) => ({
      title,
      path: `src/data/policies/${file}`,
      content: await readFile(path.join(process.cwd(), "src", "data", "policies", file), "utf8"),
    })),
  );
}
