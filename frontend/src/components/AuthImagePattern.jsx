const AuthImagePattern = ({ title, subtitle, variant }) => {
  return (
    <div className="hidden items-center justify-center bg-base-200 p-12 lg:flex">
      <div className={`${variant === "login" ? "max-w-lg" : "max-w-md"} text-center`}>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-primary/10 ${i % 2 === 0 ? "animate-pulse" : ""}`}
            />
          ))}
        </div>
        <h2 className="mb-4 text-2xl font-bold text-base-content">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
