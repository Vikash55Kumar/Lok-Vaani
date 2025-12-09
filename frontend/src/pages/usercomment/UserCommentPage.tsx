import { useState } from "react";
import Header from "./components/layout/Header";
import SplitLayout from "./components/layout/SplitLayout";
import DraftViewer from "./features/consultation/DraftViewer";
import ActionPanel from "./features/consultation/ActionPanel";
import { mockChapters } from "./data/mockData";

const UserCommentPage = () => {
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);

  const selectedChapter =
    mockChapters.find((c) => c.id === selectedChapterId) || null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans">
      <Header />
      <main className="flex-1 h-[calc(100vh-240px)]">
        <SplitLayout
          left={<DraftViewer selectedChapter={selectedChapter} />}
          right={
            <ActionPanel
              selectedChapter={selectedChapter}
              onChapterSelect={setSelectedChapterId}
              currentPhase={currentPhase}
              onPhaseChange={setCurrentPhase}
            />
          }
        />
      </main>
    </div>
  );
}

export default UserCommentPage