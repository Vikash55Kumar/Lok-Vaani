import React, { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import Modal from "../../components/ui/Modal";
import { mockChapters } from "../../data/mockData";

interface ChapterSelectorProps {
  selectedChapter: { id: string; title: string } | null;
  onChapterSelect: (chapterId: string) => void;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  selectedChapter,
  onChapterSelect,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Action
        </label>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 text-sm text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="truncate">
            {selectedChapter ? selectedChapter.title : "Select a chapter..."}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Chapter"
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {mockChapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => {
                onChapterSelect(chapter.id);
                setIsModalOpen(false);
              }}
              className="w-full flex items-start p-3 hover:bg-blue-50 transition-colors text-left group"
            >
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3 group-hover:text-blue-600" />
              <div>
                <span className="block text-sm font-medium text-gray-900 group-hover:text-blue-700">
                  {chapter.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ChapterSelector;
