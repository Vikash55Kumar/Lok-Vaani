import React, { useState, useEffect } from "react";
import RadioGroup from "../../components/ui/RadioGroup";
import Button from "../../components/ui/Button";
import { Mic, MicOff } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

interface CommentSectionProps {
  onSubmit: (data: { sentiment: string; comment: string }) => void;
  disabled?: boolean;
  onCommentChange?: (hasComment: boolean) => void;
  hasFileUploaded?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ onSubmit, disabled = false, onCommentChange, hasFileUploaded = false }) => {
  const [sentiment, setSentiment] = useState("agreement");
  const [comment, setComment] = useState("");
  const [prevComment, setPrevComment] = useState("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (listening) {
      const newComment = prevComment + (prevComment && transcript ? " " : "") + transcript;
      setComment(newComment);
      onCommentChange?.(newComment.trim().length > 0);
    }
  }, [transcript, listening, prevComment, onCommentChange]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComment = e.target.value;
    setComment(newComment);
    onCommentChange?.(newComment.trim().length > 0);
  };

  const handleToggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      setPrevComment(comment);
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-IN', });
    }
  };

  const handleSubmit = () => {
    // Allow submit if file is uploaded OR comment is typed
    if (!comment.trim() && !hasFileUploaded) return;
    onSubmit({ sentiment, comment });
  };

  // Button is active if file is uploaded OR comment is typed
  const isSubmitEnabled = hasFileUploaded || comment.trim().length > 0;

  if (!browserSupportsSpeechRecognition) {
    // Fallback or just don't show the mic, but component should still work
    // console.warn("Browser does not support speech recognition.");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`space-y-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-sm font-medium text-gray-900">
          Your Feedback
        </label>
        <RadioGroup
          name="sentiment"
          value={sentiment}
          onChange={setSentiment}
          options={[
            { value: "agreement", label: "In Agreement" },
            { value: "removal", label: "Suggest Removal" },
            { value: "modification", label: "Suggest Modification" },
          ]}
        />
      </div>

      <div className={`space-y-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center">
          <label
            htmlFor="comment"
            className="text-sm font-medium text-gray-900"
          >
            Add Comments
          </label>
          {browserSupportsSpeechRecognition && (
            <button
              onClick={handleToggleListening}
              className={`p-2 rounded-full transition-colors ${
                listening
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={listening ? "Stop recording" : "Start recording"}
              type="button"
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
        <textarea
          id="comment"
          rows={6}
          className="w-full border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Type your comments here..."
          value={comment}
          onChange={handleCommentChange}
          disabled={disabled}
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={!isSubmitEnabled}
      >
        SUBMIT
      </Button>
    </div>
  );
};

export default CommentSection;
