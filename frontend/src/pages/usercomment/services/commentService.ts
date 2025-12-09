// Comment submission service for POST API with FormData

// import { mockMetadata } from "../data/mockData";

// Interface for company data from API
export interface CompanyData {
  id: string;
  name: string;
  uniNumber: string;
  state: string;
  businessCategoryId?: string;
  categoryName?: string;
  [key: string]: any;
}

// Interface for comment data
export interface CommentData {
  sentiment: string;
  comment: string;
  chapterId?: string;
}

// Interface for user form data
export interface UserFormData {
  representing: string;
  orgName: string;
  industry: string;
  email: string;
  uin: string;
  address1: string;
  address2: string;
  country: string;
  pinCode: string;
  city: string;
  state: string;
  mobile: string;
}

// Interface for the submission payload
export interface SubmissionPayload {
  userData: UserFormData;
  companyData: CompanyData | null;
  comments: CommentData[];
  file: File | null;
}

// // Map industry to category name and role
// const industryToCategoryMap: Record<string, { categoryName: string; role: string }> = {
//   tech: { categoryName: "Technology Professional", role: "technology professional" },
//   finance: { categoryName: "Finance Professional", role: "finance professional" },
//   legal: { categoryName: "Legal Professional", role: "legal professional" },
//   "": { categoryName: "General", role: "stakeholder" },
// };

// Calculate word count from comment text
// const calculateWordCount = (text: string): number => {
//   return text.trim().split(/\s+/).filter(word => word.length > 0).length;
// };

// Generate a UUID (for demo purposes, in production use a proper UUID library)
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// API endpoint from environment variable
const API_ENDPOINT = import.meta.env.VITE_COMMENT_SUBMIT_API;

/**
 * Submit comment with FormData to the POST API
 * @param payload - The submission payload containing user data, company data, comments, and file
 * @returns Promise with the API response
 */
export const submitComment = async (payload: SubmissionPayload): Promise<any> => {
  const { userData, companyData, comments, file } = payload;

  // Determine submission type: either file upload OR comment (mutually exclusive)
  const isFileSubmission = !!file;
  const isCommentSubmission = comments.length > 0 && comments.some(c => c.comment?.trim());

  // Get the latest comment (or combine all comments) - only if comment submission
  const latestComment = isCommentSubmission ? comments[comments.length - 1] : null;
  const combinedComment = isCommentSubmission ? comments.map(c => c.comment).join("\n\n") : "";
  
  // Map industry to category
  // const industryMapping = industryToCategoryMap[userData.industry] || industryToCategoryMap[""];

  // Build FormData
  const formData = new FormData();

  const businessCategoryId = companyData?.businessCategoryId || generateUUID();
  const isIndividual = userData.representing === "individual";
  const userCategoryId = isIndividual ? "" : businessCategoryId;

  // Add only the specified fields
  formData.append("companyId", companyData?.id || generateUUID());
  formData.append("businessCategoryId", businessCategoryId);
  formData.append("companyName", companyData?.name || userData.orgName);
  formData.append("state", companyData?.state || userData.state);
  // Only append USER_CATEGORY_ID if not individual
  if (!isIndividual && userCategoryId) {
    formData.append("USER_CATEGORY_ID", userCategoryId);
  }
  
  // Determine commentType
  let commentTypeValue = "overall";
  if (isFileSubmission) {
      commentTypeValue = "file_upload";
  } else {
      commentTypeValue = latestComment?.sentiment === "agreement" ? "overall" : (latestComment?.sentiment || "overall");
  }
  formData.append("commentType", commentTypeValue);

  // Add comment or file (mutually exclusive)
  if (isFileSubmission && file) {
    formData.append("file", file);
  } else if (isCommentSubmission && combinedComment) {
    formData.append("comment", combinedComment);
  }

  // Log FormData contents for debugging
  console.log("FormData contents:");
  const payloadToLog: { [key: string]: any } = {};
  for (const [key, value] of formData.entries()) {
    payloadToLog[key] = value;
  }
  console.log("Sending Payload Object:", payloadToLog);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      body: formData,
      // Note: Don't set Content-Type header - browser will set it automatically with boundary
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("POST API Response:", result);
    // Log the API data property if present
    if (result?.data) {
      console.log("API Data:", result.data);
    }
    return result;
  } catch (error) {
    console.error("Failed to submit comment:", error);
    throw error;
  }
};

export default submitComment;
