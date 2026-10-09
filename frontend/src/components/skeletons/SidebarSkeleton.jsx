import { Users } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="w-full border-b border-base-300 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium">Contacts</span>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto py-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="flex w-full items-center gap-3 px-4 py-3">
            <div className="skeleton size-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="skeleton mb-2 h-4 w-32" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarSkeleton;
