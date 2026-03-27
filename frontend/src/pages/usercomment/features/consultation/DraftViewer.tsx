import React from "react";
import { FileText } from "lucide-react";

interface DraftViewerProps {
  selectedChapter: {
    id: string;
    title: string;
    content: string;
  } | null;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ selectedChapter }) => {
  if (!selectedChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
        <div className="bg-gray-100 p-4 mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Chapter Selected
        </h3>
        <p className="max-w-sm">
          Please select a chapter from the action panel to view its content and
          provide your feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="p-10 bg-white min-h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide">
        {selectedChapter.title}
      </h2>
      <div className="prose prose-slate max-w-none">
        <div className="whitespace-pre-wrap font-serif text-base leading-relaxed text-gray-800">
          {selectedChapter.content}
        </div>
      </div>
    </div>
  );
};

export default DraftViewer;
