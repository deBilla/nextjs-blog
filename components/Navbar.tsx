import { useRouter } from "next/router";
import React from "react";

const Navbar: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="max-w-2xl mx-auto px-6 pt-6 pb-2">
      <a
        onClick={() => router.push("/")}
        className="text-sm font-medium cursor-pointer"
      >
        &larr; Dimuthu Wickramanayake
      </a>
    </nav>
  );
};

export default Navbar;
