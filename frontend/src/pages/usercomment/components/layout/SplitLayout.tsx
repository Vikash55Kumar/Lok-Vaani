import React from "react";

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({ left, right }) => {
  return (
    <div className="flex flex-col lg:flex-row h-full gap-2 p-2 bg-[#F0F4F8]">
      <div className="w-full lg:w-3/5 h-full overflow-y-auto shadow-sm bg-white border border-gray-200">
        {left}
      </div>
      <div className="w-full lg:w-2/5 h-full overflow-y-auto shadow-sm bg-white border border-gray-200">
        {right}
      </div>
    </div>
  );
};

export default SplitLayout;
