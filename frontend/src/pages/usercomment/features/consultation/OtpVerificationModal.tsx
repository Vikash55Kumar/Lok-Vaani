import React, { useState } from "react";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
}) => {
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const handleOtpSubmit = () => {
    if (otp === "123456") {
      onVerify();
      setOtp(""); // Reset OTP on success if needed, or let parent handle closing
    } else {
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter OTP">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Please enter the OTP sent to your registered mobile number/email.
        </p>
        <div>
          <Input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setOtpError("");
            }}
            maxLength={6}
          />
          {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleOtpSubmit}>Verify & Submit</Button>
        </div>
      </div>
    </Modal>
  );
};

export default OtpVerificationModal;
