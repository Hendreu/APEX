import type { ConfigMCPV1 } from "@opencode-ai/core/v1/config/mcp"

export const DEFAULT_MCPS: Record<string, ConfigMCPV1.Info | { enabled: boolean }> = {
  ast_grep: { type: "local", command: ["npx", "-y", "ast-grep-mcp"] },
  basic_memory: { type: "local", command: ["uvx", "basic-memory", "mcp"] },
  context7: { type: "remote", url: "https://mcp.context7.com/mcp" },
  grep_app: { type: "remote", url: "https://mcp.grep.app" },
  lsp: {
    type: "local",
    command: [
      "npx",
      "-y",
      "--silent",
      "git+https://github.com/jonrad/lsp-mcp",
      "--lsp",
      "npx",
      "-y",
      "--silent",
      "-p",
      "typescript@5.7.3",
      "-p",
      "typescript-language-server@4.3.3",
      "typescript-language-server",
      "--stdio",
    ],
  },
  serena: {
    type: "local",
    command: ["uvx", "--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--project-from-cwd"],
  },
  websearch: { type: "remote", url: "https://search.parallel.ai/mcp" },
}
