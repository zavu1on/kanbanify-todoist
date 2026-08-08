import type { RawMatch } from "./types";

const PROJECT_RE = /#(\S+)/g;

export const collectProjectMatches = (
  text: string,
  projects: { id: string; name: string }[],
): RawMatch[] =>
  [...text.matchAll(PROJECT_RE)]
    .map((match): RawMatch | null => {
      const start = match.index ?? 0;
      const project = projects.find(
        (p) => p.name.toLowerCase() === match[1]?.toLowerCase(),
      );
      if (!project) return null;
      return {
        start,
        end: start + match[0].length,
        type: "project",
        projectId: project.id,
      };
    })
    .filter((match): match is RawMatch => match !== null);

/** No spaces in the token means multi-word project names can't round-trip
 * through plain text — `null` tells the caller to skip inserting a token,
 * the field itself is still updated normally through its own control. */
export const buildProjectToken = (projectName: string): string | null =>
  /\s/.test(projectName) ? null : `#${projectName}`;
