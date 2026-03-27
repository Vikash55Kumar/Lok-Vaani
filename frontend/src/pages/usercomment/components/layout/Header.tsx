import { mockMetadata } from "../../data/mockData";
import { cn } from "../../../../lib/utils";

const Header = () => {
  return (
    <header className="bg-white px-8 pt-4 pb-6 shadow-sm">

      {/* Title */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          {mockMetadata.actName}
        </h1>
      </div>

      {/* Tabs & Actions */}
      <div className="flex items-center justify-between border-b border-gray-200 mb-2">
        <div className="flex space-x-1">
          {["Public Notice", "Instruction Kit", "Document details and comments"].map(
            (tab, index) => (
              <button
                key={tab}
                className={cn(
                  "px-6 py-2.5 text-sm font-medium transition-colors",
                  index === 2
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-6 gap-4">
        <MetadataField label="Document ID" value={mockMetadata.documentId} />
        <MetadataField label="Type of Documents" value={mockMetadata.type} />
        <MetadataField label="Document Name" value={mockMetadata.name} />
        <MetadataField label="Name of Act" value={mockMetadata.actName} />
        <MetadataField label="Posted On" value={mockMetadata.postedOn} />
        <MetadataField label="Comments due date" value={mockMetadata.dueDate} />
      </div>
    </header>
  );
};

const MetadataField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col space-y-1.5">
    <span className="text-xs font-semibold text-gray-500">{label}</span>
    <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 truncate border border-gray-200">
      {value}
    </div>
  </div>
);

export default Header;
