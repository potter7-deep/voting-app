import { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center">
      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[70vh]">
        <div className="order-2 md:order-1">
          <p className="text-lg text-gray-500 dark:text-gray-400 font-semibold tracking-wide uppercase mb-2">
            Dedan Kimathi University of Technology
          </p>
          <h1 className="text-6xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-[#10b981] to-[#14b8a6] bg-clip-text text-transparent">
            Kimathi Voting System
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Secure, transparent, and efficient voting for your university community
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/login"
              className="px-8 py-4 text-xl bg-gradient-to-r from-[#10b981] to-[#14b8a6] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 text-xl bg-gradient-to-r from-[#8b5cf6] to-[#6ee7b7] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Register
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <img 
            src="/img/KVS.png" 
            alt="Kimathi Voting System" 
            className="max-w-[400px] h-auto object-contain animate-float bg-transparent"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-5xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Why Vote Here?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card group">
            <div className="w-20 h-20 bg-gradient-to-br from-[#10b981]/10 to-[#14b8a6]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Secure & Safe</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your vote is encrypted and protected with industry-standard security
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card group">
            <div className="w-20 h-20 bg-gradient-to-br from-[#10b981]/10 to-[#14b8a6]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Transparent</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real-time results and voting statistics available to all users
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card group">
            <div className="w-20 h-20 bg-gradient-to-br from-[#10b981]/10 to-[#14b8a6]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Easy to Use</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Simple and intuitive interface designed for all users
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;

