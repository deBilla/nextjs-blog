import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 py-8 mt-16">
      <p className="text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Dimuthu Wickramanayake
      </p>
    </footer>
  );
};

export default Footer;
