import { useEffect } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';

/** The copy surfaced to the native unload prompt; browsers show their own generic message instead. */
const UnsavedChangesMessage = 'You have unsaved changes that may be lost.';

/** Warns the browser before a full-page unload/tab-close by returning a truthy string. */
function handleBeforeUnload(event: BeforeUnloadEvent): string {
  event.preventDefault();
  event.returnValue = UnsavedChangesMessage; // legacy browsers read the assigned value
  return UnsavedChangesMessage; // older browsers read the returned value
}

/** Manages navigation blocking for a dirty form — intercepts in-app routing and full-page unloads while `shouldBlock`; returns the rrd blocker for a confirm dialog. */
export function useNavigationBlocker(shouldBlock: boolean): Blocker {
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!shouldBlock) return;
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldBlock]);

  return blocker;
}
