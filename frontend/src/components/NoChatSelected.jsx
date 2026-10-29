import { ArrowLeftRight, MessageCircle, Sparkles } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="empty-chat-panel dashboard-empty-panel hidden w-full flex-1 flex-col items-center justify-center p-8 sm:p-12 lg:flex">
      <div className="dashboard-empty-content">
        <div className="dashboard-empty-art" aria-hidden="true">
          <div className="dashboard-empty-sparkle"><Sparkles className="size-4" /></div>
          <div className="dashboard-empty-bubble dashboard-empty-bubble-back">
            <span />
            <span />
            <span />
          </div>
          <div className="dashboard-empty-bubble dashboard-empty-bubble-front">
            <MessageCircle className="size-8" />
          </div>
          <div className="dashboard-empty-swap"><ArrowLeftRight className="size-4" /></div>
        </div>

        <div className="dashboard-empty-copy">
          <span>YOUR MESSAGES, YOUR PEOPLE</span>
          <h2>Your next good conversation starts here.</h2>
          <p>Choose someone from your contacts and catch up, share a moment, or just say hello.</p>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
