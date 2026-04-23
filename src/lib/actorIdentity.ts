function tryParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function deepFind(input: any, keys: string[]): string | null {
  if (!input || typeof input !== "object") return null;

  for (const key of keys) {
    if (typeof input[key] === "string" && input[key].trim()) {
      return input[key].trim();
    }
  }

  const nested = [
    input.user,
    input.profile,
    input.session,
    input.currentSession,
    input.user_metadata,
    input.app_metadata,
    input.currentSession?.user,
    input.session?.user,
    input.user?.user_metadata,
    input.user?.app_metadata,
    input.currentSession?.user?.user_metadata,
    input.currentSession?.user?.app_metadata,
  ];

  for (const item of nested) {
    const found = deepFind(item, keys);
    if (found) return found;
  }

  return null;
}

export function inferActorIdentity() {
  if (typeof window === "undefined") {
    return { name: "", role: "", email: "" };
  }

  const candidateKeys = [
    "user",
    "profile",
    "currentUser",
    "auth_user",
    "session",
    "auth",
    "britium_user",
    "britium_profile",
  ];

  const parsedObjects: any[] = [];

  for (const key of candidateKeys) {
    const parsed = tryParse(window.localStorage.getItem(key));
    if (parsed) parsedObjects.push(parsed);
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (
      key.includes("auth-token") ||
      key.includes("supabase") ||
      key.includes("session") ||
      key.includes("profile")
    ) {
      const parsed = tryParse(window.localStorage.getItem(key));
      if (parsed) parsedObjects.push(parsed);
    }
  }

  const nameKeys = ["full_name", "fullName", "name", "display_name", "displayName"];
  const roleKeys = ["role", "user_role", "userRole", "portal_role", "portalRole"];
  const emailKeys = ["email"];

  let name = "";
  let role = "";
  let email = "";

  for (const obj of parsedObjects) {
    name = name || deepFind(obj, nameKeys) || "";
    role = role || deepFind(obj, roleKeys) || "";
    email = email || deepFind(obj, emailKeys) || "";
  }

  return { name, role, email };
}

export function actorRequestHeaders() {
  const actor = inferActorIdentity();
  const requestId =
    "req-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8);

  const headers: Record<string, string> = {
    "x-request-id": requestId,
  };

  if (actor.name) headers["x-actor-name"] = actor.name;
  if (actor.role) headers["x-actor-role"] = actor.role;
  if (actor.email) headers["x-actor-email"] = actor.email;

  return headers;
}

export function appendActorQuery(qs: URLSearchParams) {
  const actor = inferActorIdentity();
  if (actor.name) qs.set("actor_name", actor.name);
  if (actor.role) qs.set("actor_role", actor.role);
  if (actor.email) qs.set("actor_email", actor.email);
  return qs;
}
