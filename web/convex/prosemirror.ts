import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Create ProsemirrorSync instance with document ID type
const prosemirrorSync = new ProsemirrorSync<Id<"docs">>(
  components.prosemirrorSync
);

// Export the sync API
// Note: For production, you should add authorization checks via checkRead/checkWrite
export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({
  // Optional: Add authorization checks here
  // async checkRead(ctx, docId) { ... },
  // async checkWrite(ctx, docId) { ... },
});

// Export the prosemirrorSync for creating documents
export { prosemirrorSync };
