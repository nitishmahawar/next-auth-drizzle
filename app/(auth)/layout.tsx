import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="h-screen w-full flex items-center justify-center px-4 py-6 bg-accent/50">
      {children}
    </main>
  );
};

export default AuthLayout;
