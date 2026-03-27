import { generateWordCloudEvent } from "./functions/on-cloud_summary-flow";
import { 
  systemHealthCheck,
  commentFetchScheduler,
  processRawComments,
  manualCommentFetch
} from "./functions/on-comment-flow";

// Export functions for the serve handler
export const functions = [
  systemHealthCheck,
  commentFetchScheduler,
  processRawComments,
  generateWordCloudEvent,
  manualCommentFetch
];