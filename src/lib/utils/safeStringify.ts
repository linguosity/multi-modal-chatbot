export function safeStringify(value: unknown, space = 2): string {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (_, v) => {
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    },
    space
  );
}

// Lightweight debug function for development
export function safeDebug(obj: unknown, space = 2): string {
  try {
    return JSON.stringify(obj, (_, v) =>
      typeof v === "object" && v !== null ? v : v,
      space
    );
  } catch {
    return "[Unserialisable]";
  }
}