import { readFile } from "node:fs/promises";

interface PullRequestEvent {
  repository?: { full_name?: string };
  pull_request?: {
    title?: string;
    body?: string | null;
    base?: { ref?: string };
  };
}

export async function githubMetadata(environment: NodeJS.ProcessEnv = process.env) {
  if (!environment.GITHUB_EVENT_PATH) return {};
  const event = JSON.parse(await readFile(environment.GITHUB_EVENT_PATH, "utf8")) as PullRequestEvent;
  return {
    repository: event.repository?.full_name,
    title: event.pull_request?.title,
    description: event.pull_request?.body ?? undefined,
    base: event.pull_request?.base?.ref ? `origin/${event.pull_request.base.ref}` : undefined,
  };
}
