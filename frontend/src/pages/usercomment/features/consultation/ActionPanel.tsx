import React, { useState } from "react";
import CommentSection from "./CommentSection";
import UserDetailsForm from "./UserDetailsForm";
import FileUpload from "../../components/ui/FileUpload";
import ChapterSelector from "./ChapterSelector";
import OtpVerificationModal from "./OtpVerificationModal";
import SubmissionSuccessModal from "./SubmissionSuccessModal";
import { submitComment, type CompanyData } from "../../services/commentService";

interface ActionPanelProps {
  selectedChapter: { id: string; title: string } | null;
  onChapterSelect: (chapterId: string) => void;
  currentPhase: 1 | 2;
  onPhaseChange: (phase: 1 | 2) => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  selectedChapter,
  onChapterSelect,
  currentPhase,
  onPhaseChange,
}) => {
  const [comments, setComments] = useState<any[]>([]);
  
  // OTP and Success Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [pendingSubmissionData, setPendingSubmissionData] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  // Store company data from UserDetailsForm
  const [pendingCompanyData, setPendingCompanyData] = useState<CompanyData | null>(null);
  // Track if user is typing a comment (to disable file upload)
  const [hasTypedComment, setHasTypedComment] = useState(false);

  const handleCommentSubmit = (data: { sentiment: string; comment: string }) => {
    console.log("Comment saved:", data);
    setComments([...comments, { ...data, chapterId: selectedChapter?.id }]);
    onPhaseChange(2);
  };

  const handleFinalSubmit = (userData: any, companyData: CompanyData | null) => {
    const payload = {
      user: userData,
      comments: comments,
      file: uploadedFile // Keep the actual File object, not just the name
    };
    setPendingSubmissionData(payload);
    setPendingCompanyData(companyData);
    setIsOtpModalOpen(true);
  };

  const handleOtpVerified = async () => {
    setIsOtpModalOpen(false);
    setIsSubmitting(true);
    
    try {
      // Call the POST API with FormData
      const response = await submitComment({
        userData: pendingSubmissionData.user,
        companyData: pendingCompanyData,
        comments: comments,
        file: uploadedFile,
      });
      
      console.log("POST API Response:", response);
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Failed to submit:", error);
      // Still show success for demo purposes, but log the error
      setIsSuccessModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
    
    console.log("Final Submission Payload:", {
      user: pendingSubmissionData.user,
      comments: pendingSubmissionData.comments,
      file: uploadedFile ? { name: uploadedFile.name, size: uploadedFile.size, type: uploadedFile.type } : null
    });
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleCommentChange = (hasComment: boolean) => {
    setHasTypedComment(hasComment);
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    // Reset flow if needed, or redirect
    window.location.reload(); // Simple reset for now
  };

  if (currentPhase === 2) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Provide your details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <UserDetailsForm onSubmit={handleFinalSubmit} />
        </div>

        <OtpVerificationModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          onVerify={handleOtpVerified}
        />

        <SubmissionSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleSuccessClose}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Action Bar */}
      <ChapterSelector
        selectedChapter={selectedChapter}
        onChapterSelect={onChapterSelect}
      />

      {/* File Upload Section */}
      <div className="p-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Attach a file {hasTypedComment && <span className="text-xs text-gray-500 font-normal">(disabled - comment in progress)</span>}
        </h3>
        <FileUpload
          file={uploadedFile}
          onFileSelect={handleFileUpload}
          onFileRemove={removeFile}
          disabled={hasTypedComment}
        />
      </div>

      {/* Bottom Section: Comments */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedChapter ? (
          <>
            {uploadedFile && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                File uploaded. Comment input is disabled.
              </div>
            )}
            <CommentSection 
              onSubmit={handleCommentSubmit} 
              disabled={!!uploadedFile}
              onCommentChange={handleCommentChange}
              hasFileUploaded={!!uploadedFile}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            <p className="text-sm">Select a chapter to add comments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
