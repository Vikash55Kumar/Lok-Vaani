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
// Comment submission service for POST API with FormData

// Comment submission service for POST API with FormData

// // Interface for company data from API
// export interface CompanyData {
//   id: string;
//   name: string;
//   uniNumber: string;
//   state: string;
//   businessCategoryId?: string;
//   categoryName?: string;
//   [key: string]: any;
// }

// // Interface for comment data
// export interface CommentData {
//   sentiment: string;
//   comment: string;
//   chapterId?: string;
// }

// // Interface for user form data
// export interface UserFormData {
//   representing: string;
//   orgName: string;
//   industry: string;
//   email: string;
//   uin: string;
//   address1: string;
//   address2: string;
//   country: string;
//   pinCode: string;
//   city: string;
//   state: string;
//   mobile: string;
// }

// // Interface for the submission payload
// export interface SubmissionPayload {
//   userData: UserFormData;
//   companyData: CompanyData | null;
//   comments: CommentData[];
//   file: File | null;
// }

// // Generate a UUID (for demo purposes, in production use a proper UUID library)
// const generateUUID = (): string => {
//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// };

// // API endpoint from environment variable
// const API_ENDPOINT = import.meta.env.VITE_COMMENT_SUBMIT_API;

// /**
//  * Submit comment with FormData to the POST API
//  * @param payload - The submission payload containing user data, company data, comments, and file
//  * @returns Promise with the API response
//  */
// export const submitComment = async (payload: SubmissionPayload): Promise<any> => {
//   const { userData, companyData, comments, file } = payload;

//   // Validate that we have either a file or comments
//   const isFileSubmission = !!file;
//   const isCommentSubmission = comments.length > 0 && comments.some(c => c.comment?.trim());

//   if (!isFileSubmission && !isCommentSubmission) {
//     throw new Error("Either a file or comment is required for submission");
//   }

//   // Get the latest comment (or combine all comments) - only if comment submission
//   const latestComment = isCommentSubmission ? comments[comments.length - 1] : null;
//   const combinedComment = isCommentSubmission ? comments.map(c => c.comment).join("\n\n") : "";

//   // Build FormData
//   const formData = new FormData();

//   const isIndividual = userData.representing === "individual";
//   const businessCategoryId = companyData?.businessCategoryId || generateUUID();
//   const companyId = companyData?.id || generateUUID();
//   const companyName = companyData?.name || userData.orgName;
//   const state = companyData?.state || userData.state;

//   // Add required fields - ONLY these fields are needed
//   formData.append("companyId", companyId);
//   formData.append("businessCategoryId", businessCategoryId);
//   formData.append("companyName", companyName);
//   formData.append("state", state);

//   // Determine commentType based on submission type
//   let commentTypeValue = "overall";
//   if (isFileSubmission) {
//     commentTypeValue = "file_upload";
//   } else if (latestComment?.sentiment) {
//     commentTypeValue = latestComment.sentiment === "agreement" ? "overall" : latestComment.sentiment;
//   }
//   formData.append("commentType", commentTypeValue);

//   // Add USER_CATEGORY_ID (same as businessCategoryId for organization, empty for individual)
//   if (!isIndividual) {
//     formData.append("USER_CATEGORY_ID", businessCategoryId);
//   }

//   // Add file OR comment (mutually exclusive - never both)
//   if (isFileSubmission && file) {
//     // Validate file before appending
//     if (file.size === 0) {
//       throw new Error("File is empty (0 bytes)");
//     }
    
//     console.log("=== File Upload Details ===");
//     console.log("File name:", file.name);
//     console.log("File size:", file.size, "bytes");
//     console.log("File type:", file.type || "unknown");
    
//     // Append file - API will process it on the server side
//     formData.append("file", file, file.name);
    
//   } else if (isCommentSubmission && combinedComment) {
//     // Only append comment when NOT uploading a file
//     formData.append("comment", combinedComment);
//   }

//   // Log FormData contents for debugging
//   console.log("=== FormData Submission Details ===");
//   console.log("API Endpoint:", API_ENDPOINT);
//   console.log("Submission Type:", isFileSubmission ? "FILE UPLOAD" : "COMMENT");
//   console.log("Is Individual:", isIndividual);
  
//   const payloadToLog: { [key: string]: any } = {};
  
//   for (const [key, value] of formData.entries()) {
//     if (value instanceof File) {
//       payloadToLog[key] = `File { name: '${value.name}', size: ${value.size}, type: '${value.type}' }`;
//     } else {
//       payloadToLog[key] = value;
//     }
//   }
  
//   console.log("Payload Object:", payloadToLog);

//   try {
//     console.log("Sending POST request...");
    
//     const response = await fetch(API_ENDPOINT, {
//       method: "POST",
//       body: formData,
//       // Don't set Content-Type - browser sets it automatically with boundary
//     });

//     console.log("Response received - Status:", response.status, response.statusText);

//     // Try to parse response
//     let result;
//     const contentType = response.headers.get("content-type");
    
//     if (contentType && contentType.includes("application/json")) {
//       result = await response.json();
//     } else {
//       const textResponse = await response.text();
//       console.error("Non-JSON response received:", textResponse.substring(0, 500));
      
//       if (!response.ok) {
//         throw new Error(`Server error (${response.status}): ${textResponse.substring(0, 200)}`);
//       }
      
//       // Try to parse as JSON anyway
//       try {
//         result = JSON.parse(textResponse);
//       } catch {
//         throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}`);
//       }
//     }

//     if (!response.ok) {
//       console.error("❌ API Error Response:", result);
//       const errorMessage = result?.message || result?.error || result?.msg || "Unknown error";
//       throw new Error(`HTTP ${response.status}: ${errorMessage}`);
//     }

//     console.log("✅ POST API Success!");
//     console.log("Response:", result);
//     if (result?.data) {
//       console.log("Data:", result.data);
//     }
    
//     return result;
    
//   } catch (error) {
//     console.error("❌ Submission Failed");
    
//     if (error instanceof TypeError) {
//       console.error("Network/CORS error - server may be unreachable");
//     }
    
//     if (error instanceof Error) {
//       console.error("Message:", error.message);
//     } else {
//       console.error("Error:", error);
//     }
    
//     throw error;
//   }
// };

// export default submitComment;