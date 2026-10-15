import { Heart, MessageSquare } from "lucide-react";

const AuthImagePattern = ({ title, subtitle, variant }) => {
  const isLogin = variant === "login";

  return (
    <div className="hidden items-center justify-center bg-base-200 p-12 lg:flex">
      <div className={`${isLogin ? "max-w-xl" : "max-w-md"} w-full text-center`}>
        {isLogin ? (
          <div className="relative mb-12 px-3 sm:px-8" aria-hidden="true">
            <div className="absolute -right-2 top-0 flex -translate-y-1/2 items-center gap-2 rounded-full bg-neutral px-4 py-2 text-sm font-medium text-neutral-content shadow-lg sm:right-0">
              <MessageSquare className="size-4" />
              <span>3 new messages</span>
            </div>

            <div className="space-y-5 rounded-[2rem] bg-base-100 p-5 shadow-xl sm:p-8">
              <div className="flex items-end gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  M
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-base-200 px-4 py-3 text-left text-sm text-base-content">
                  Manok Kaba?
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-left text-sm text-primary-content">
                  Bakit
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  M
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-base-200 px-4 py-3 text-left text-sm text-base-content">
                  kasi mahal kita
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-left text-sm text-primary-content">
                  Asan ung manok hahaha
                </div>
              </div>

              <div className="flex items-end gap-3 pt-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  M
                </div>
                <div className="flex gap-1 rounded-2xl bg-base-200 px-4 py-3">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="size-2 rounded-full bg-primary/60" />
                  <span className="size-2 rounded-full bg-primary/30" />
                </div>
                <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-base-200 px-4 py-3 text-left text-sm text-base-content">
                  Kahit chicken mo pa po
                </div>
              </div>
            </div>

            <div className="absolute -left-1 bottom-16 flex size-12 items-center justify-center rounded-2xl bg-base-100 text-primary shadow-lg sm:left-0">
              <Heart className="size-6" />
            </div>
            <div className="absolute -bottom-5 right-0 flex items-center rounded-full bg-base-100 py-2 pl-2 pr-4 shadow-lg sm:right-2">
              <div className="flex -space-x-2">
                <span className="size-8 rounded-full border-2 border-base-100 bg-primary" />
                <span className="size-8 rounded-full border-2 border-base-100 bg-secondary" />
                <span className="size-8 rounded-full border-2 border-base-100 bg-accent" />
              </div>
              <span className="ml-3 text-xs font-medium text-base-content">Friends online</span>
            </div>
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-2xl bg-primary/10 ${i % 2 === 0 ? "animate-pulse" : ""}`}
              />
            ))}
          </div>
        )}
        <h2 className="mb-4 text-2xl font-bold text-base-content">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
