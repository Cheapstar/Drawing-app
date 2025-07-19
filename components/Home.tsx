"use client";
import { redirect } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  LuArrowRight,
  LuUsers,
  LuShare2,
  LuZap,
  LuPalette,
  LuMousePointer,
  LuSparkles,
} from "react-icons/lu";

export function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    console.log("Navigating to drawing board...");
    redirect("http://localhost:3000");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x / 10 + "px",
            top: mousePosition.y / 10 + "px",
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-40`}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <LuPalette className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Whiteboard</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-gray-300">
            <a
              href="#features"
              className="hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-gray-300 mb-6">
                <LuSparkles className="w-4 h-4 mr-2 text-yellow-400" />
                No sign-up required • Start creating instantly
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Collaborate
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  {" "}
                  Visually
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Create, collaborate, and share your ideas in real-time with our
                powerful whiteboard platform. No barriers, just pure creativity.
              </p>
            </div>

            {/* CTA Button */}
            <div className="mb-16">
              <button
                onClick={handleGetStarted}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r
                 from-purple-500 to-cyan-500 text-white font-semibold text-lg rounded-full
                  hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 transform
                   hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
              >
                <span className="relative z-10">Get Started</span>
                <LuArrowRight
                  className={`ml-2 w-5 h-5 transition-transform duration-300 ${
                    isHovered ? "translate-x-1" : ""
                  }`}
                />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <LuUsers className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Real-time Collaboration
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Work together seamlessly with your team. See cursors, edits,
                  and changes in real-time.
                </p>
              </div>

              <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
                  <LuShare2 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Scene Sharing
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Share your creations instantly with a simple link. No
                  downloads, no hassle.
                </p>
              </div>

              <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-500/30 transition-colors">
                  <LuZap className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Lightning Fast
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Jump right in without sign-ups or downloads. Start creating in
                  seconds.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-gray-400 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto">
            <p>&copy; 2025 Whiteboard. Built for creators, by creators.</p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <LuMousePointer className="w-4 h-4" />
              <span className="text-sm">
                Ready to create something amazing?
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
