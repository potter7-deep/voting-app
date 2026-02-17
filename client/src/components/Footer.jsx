const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-white to-[#f0fdf4] dark:from-[#1e293b] dark:to-[#0f3d2a] border-t-2 border-gray-200 dark:border-gray-700 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            &copy; {new Date().getFullYear()}  Dedan Kimathi University of Technology Voting System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
