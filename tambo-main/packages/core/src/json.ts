/** Parse a JSON string, but don't throw an error if it's not valid JSON */
export function tryParseJson(
  text: string,
): Array<unknown> | Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

/** Parse a JSON string, optionally throwing an error if it is definitively not a JSON object */
export function tryParseJsonObject(
  text: string,
  shouldThrow: boolean = false,
): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (trimmed && !trimmed.startsWith("{")) {
    if (shouldThrow) {
      throw new Error("Not a JSON object");
    }
    return null;
  }
  const parsed = tryParseJson(trimmed);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }
  if (shouldThrow) {
    throw new Error("Not a JSON object");
  }
  return null;
}

/** Parse a JSON string, optionally throwing an error if it is definitively not a JSON array */
export function tryParseJsonArray(
  text: string,
  shouldThrow: boolean = false,
): Array<unknown> | null {
  const trimmed = text.trim();
  if (trimmed && !trimmed.startsWith("[")) {
    if (shouldThrow) {
      throw new Error("Not a JSON array");
    }
    return null;
  }
  const parsed = tryParseJson(trimmed);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (shouldThrow) {
    throw new Error("Not a JSON array");
  }
  return null;
}
