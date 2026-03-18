import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800/50 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} Dimuthu Wickramanayake
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Built with Next.js &amp; TypeScript
        </p>
      </div>
    </footer>
  );
};

export default Footer;
