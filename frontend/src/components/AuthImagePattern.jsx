const AuthImagePattern = ({ title, subtitle, variant }) => {
  const isLogin = variant === "login";

  return (
    <div className={`hidden lg:flex items-center justify-center p-12 ${isLogin ? "bg-[#1b1219]" : "bg-base-200"}`}>
      <div className={`${isLogin ? "max-w-lg" : "max-w-md"} text-center`}>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl ${
                isLogin
                  ? "bg-[#30201f]"
                  : `bg-primary/10 ${i % 2 === 0 ? "animate-pulse" : ""}`
              }`}
            />
          ))}
        </div>
        <h2 className={`text-2xl font-bold mb-4 ${isLogin ? "text-[#d1a85f]" : ""}`}>{title}</h2>
        <p className={isLogin ? "text-[#96754f]" : "text-base-content/60"}>{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
