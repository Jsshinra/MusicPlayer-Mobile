type BackHandler = () => void;

const stack: BackHandler[] = [];

/**
 * Registers a back handler on top of the stack. Returns an unregister fn.
 * The topmost handler wins; AppLayout's global backButton listener calls
 * handleBack() first and only falls through to its own nav logic (and
 * eventually exitApp) when the stack is empty.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  stack.push(handler);
  return () => {
    const i = stack.lastIndexOf(handler);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Invokes the topmost handler. Returns true if one consumed the event. */
export function handleBack(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
}
