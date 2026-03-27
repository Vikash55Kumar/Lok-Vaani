import React from "react";
import { CheckCircle } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

interface SubmissionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submission Successful"
    >
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
        <div className="bg-green-100 p-3">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Thank you for your feedback!
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            Your comments have been successfully submitted to the department.
          </p>
        </div>
        <Button
          className="w-full mt-4"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default SubmissionSuccessModal;
