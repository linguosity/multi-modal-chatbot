/**
 * Utility functions to clean data and prevent circular references
 */

export function removeCircularReferences(input: unknown): unknown {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const root = Array.isArray(input) ? [] : {};
  const queue: Array<[any, any, string | number]> = [[root, input, ""]];
  const seen = new WeakMap<any, any>();

  while (queue.length) {
    const [cloneParent, original, key] = queue.shift()!;

    if (typeof original !== "object" || original === null) {
      cloneParent[key] = original;
      continue;
    }

    if (seen.has(original)) {
      cloneParent[key] = "[Circular Reference]";
      continue;
    }

    const clone: any = Array.isArray(original) ? [] : {};
    seen.set(original, clone);
    cloneParent[key] = clone;

    for (const k of Object.keys(original)) {
      queue.push([clone, original[k], k]);
    }
  }

  return root;
}

export function safeStringify(obj: any, space?: number): string {
  try {
    return JSON.stringify(obj, null, space);
  } catch (error) {
    // If JSON.stringify fails due to circular references, clean the object first
    const cleaned = removeCircularReferences(obj);
    try {
      return JSON.stringify(cleaned, null, space);
    } catch (secondError) {
      return '[Object with circular references - could not stringify]';
    }
  }
}

// Safe debug function that doesn't walk deep structures unless needed
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

export function hasCircularReference(input: unknown): boolean {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const queue: unknown[] = [input];
  const seen = new WeakSet();

  while (queue.length) {
    const current = queue.shift()!;

    if (typeof current !== "object" || current === null) {
      continue;
    }

    if (seen.has(current)) {
      return true;
    }

    seen.add(current);

    for (const value of Object.values(current)) {
      queue.push(value);
    }
  }

  return false;
}