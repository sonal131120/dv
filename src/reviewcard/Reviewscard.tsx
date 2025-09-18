import React, { useState } from "react";

// Custom Keyframes for animated gradient and rings
if (
  typeof document !== "undefined" &&
  !document.getElementById("reviewscard-animations")
) {
  const style = document.createElement("style");
  style.id = "reviewscard-animations";
  style.innerHTML = `
    @keyframes gradient-move {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .animate-gradient-move {
      background-size: 200% 200%;
      animation: gradient-move 8s ease-in-out infinite;
    }
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.5; }
    }
    .animate-pulse-slow {
      animation: pulse-slow 4s cubic-bezier(0.4,0,0.6,1) infinite;
    }
  `;
  document.head.appendChild(style);
}
import {
  Star,
  ArrowRight,
  Building2,
  Utensils,
  Car,
  Heart,
  GraduationCap,
  Home,
  ShoppingBag,
  Wrench,
} from "lucide-react";

function Reviewscard() {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(5);

  const industries = [
    { name: "Restaurants", icon: Utensils, color: "bg-orange-500 text-white" },
    { name: "Healthcare", icon: Heart, color: "bg-red-500 text-white" },
    { name: "AutoServices", icon: Car, color: "bg-blue-500 text-white" },
    {
      name: "Education",
      icon: GraduationCap,
      color: "bg-green-500 text-white",
    },
    { name: "RealEstate", icon: Home, color: "bg-purple-500 text-white" },
    { name: "Retail", icon: ShoppingBag, color: "bg-pink-500 text-white" },
    { name: "Services", icon: Wrench, color: "bg-indigo-500 text-white" },
    { name: "Hotels", icon: Building2, color: "bg-teal-500 text-white" },
  ];

  return (
    <div className="relative  flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}

      {/* Animated Rings */}

      <div className="relative z-10 bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 rounded-3xl shadow-2xl p-3 sm:p-4 md:p-8 max-w-4xl w-full transform transition-all duration-300 flex flex-col lg:flex-row gap-4 lg:gap-8">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[-200px] top-[-200px] w-[600px] h-[600px] border-8 border-blue-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute left-[-200px] top-[-200px] w-[500px] h-[500px] border-8 border-pink-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute left-[-200px] top-[-200px] w-[400px] h-[400px] border-8 border-yellow-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute left-[-200px] top-[-200px] w-[300px] h-[300px] border-8 border-orange-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute right-[-50px] bottom-[-200px] w-[500px] h-[450px] border-8 border-pink-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute right-[0px] bottom-[-200px] w-[400px] h-[400px] border-8 border-purple-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute right-[50px] bottom-[-200px] w-[300px] h-[350px] border-8 border-yellow-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute right-[100px] bottom-[-200px] w-[200px] h-[300px] border-8 border-orange-400/20 rounded-full animate-pulse-slow"></div>

        </div>
        {/* Left Column */}
        <div className="flex-1 flex flex-col justify-between mb-4 lg:mb-0">
          {/* Header */}
          <div className="text-center mb-0">
            <div className="flex items-center justify-center mx-auto mb-0">
              {/* Logo Display */}
              <div className="inline-block relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 relative perspective-1000">
                  {/* 3D Rotating Ring */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-spin-continuous opacity-30 transform-gpu"></div>
                  <div className="absolute inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-spin-reverse opacity-20 transform-gpu"></div>

                  {/* Main Logo Container with 3D Effect */}
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-3d transform hover:scale-110 transition-all duration-500 animate-float-gentle">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                      {/* Logo Display */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          src="/DBCLOGO_2.png"
                          alt="review Logo"
                          className="w-[30px] sm:w-[50px] animate-pulse-gentle object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Orbiting particles */}
                  <div className="absolute inset-0 animate-spin-slow">
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
                    <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-60 animate-pulse delay-300"></div>
                    <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-pink-400 rounded-full opacity-60 animate-pulse delay-600"></div>
                    <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-60 animate-pulse delay-900"></div>
                  </div>
                </div>
              </div>
              <h1 className="text-4xl p-4 font-bold text-white mb-5">+</h1>
              <div className="inline-block relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 relative perspective-1000">
                  {/* 3D Rotating Ring */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-spin-continuous opacity-30 transform-gpu"></div>
                  <div className="absolute inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-spin-reverse opacity-20 transform-gpu"></div>

                  {/* Main Logo Container with 3D Effect */}
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-3d transform hover:scale-110 transition-all duration-500 animate-float-gentle">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                      {/* Logo Display */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          src="https://github.com/yash131120/DBC_____logo/blob/main/google-maps_2702604.png?raw=true"
                          alt="review Logo"
                          className="w-[30px] sm:w-[40px] animate-pulse-gentle object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Orbiting particles */}
                  <div className="absolute inset-0 animate-spin-slow">
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
                    <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-60 animate-pulse delay-300"></div>
                    <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-pink-400 rounded-full opacity-60 animate-pulse delay-600"></div>
                    <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-60 animate-pulse delay-900"></div>
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-0">
              AI Review Generator
            </h1>
          </div>
          {/* Industries */}
          <div className="mb-0">
            <h3 className="text-base sm:text-lg font-bold text-white text-center mb-2">
              Perfect for Every Industry
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
              {industries.map((industry, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center p-1 sm:p-2 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 ${industry.color}`}
                  >
                    <industry.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-xs text-indigo-100 text-center font-medium">
                    {industry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-indigo-700 mb-2 sm:mb-4 p-2 sm:p-3">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-purple-300">
                3x
              </div>
              <div className="text-xs text-indigo-200">More Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-300">
                85%
              </div>
              <div className="text-xs text-indigo-200">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-300">
                24/7
              </div>
              <div className="text-xs text-indigo-200">AI Support</div>
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="relative mb-0 mt-0 sm:mb-0">
            <div className="relative bg-blue-200 rounded-2xl shadow-2xl p-1 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex gap-2 absolute left-4 top-5 z-30">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-1 rounded-full text-xs ">
                AI Powered✨
              </div>
              {/* Mock Phone Interface */}
              <div className="bg-gray-100 rounded-xl p-2 sm:p-3">
                <div className="flex justify-center mb-2 mt-3 sm:mt-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 sm:w-6 sm:h-6 mx-0.5 sm:mx-1 cursor-pointer transition-all duration-200 ${
                        star <= (hoveredStar || selectedRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-400"
                      } hover:scale-110`}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setSelectedRating(star)}
                    />
                  ))}
                </div>

                <div className="bg-white rounded-lg p-2 mb-1 sm:mb-1 border-l-4 border-blue-500">
                  <p className="text-gray-700 text-xs italic">
                    "Amazing service! The staff was incredibly helpful and the
                    food was delicious. Highly recommend this restaurant to
                    anyone looking for great dining experience!"
                  </p>
                  <div className="flex justify-start">
                    <button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs py-1 px-2 sm:px-3 rounded-xl">
                      Copy & Paste
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-8 bg-yellow-400 text-yellow-900 px-3 sm:px-4 py-1 rounded-full text-xs font-semibold animate-bounce">
              🚀 +300% Reviews
            </div>
          </div>
          <div className="flex -mt-6 mb-4 gap-0 items-end justify-between">
            <div className="flex-1">
            <button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-10 rounded-xl hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center group text-xs sm:text-xs border-2 border-border-white"
              onClick={() =>
                window.open(
                  "https://review.sccinfotech.com/scc-infotech-llp",
                  "_blank"
                )
              }
            >
              Get Free Demo
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            </div>

            <div className="bg-purple-200 border-2 border-purple-500 rounded-xl shadow-2xl p-2 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <p className="text-gray-700 text-xs italic mb-1">
                    Scan QR Code
                  </p>
              <div className="w-[110px] bg-gray-200 rounded-xl  ">
                
                <div className="bg-white rounded-lg border-r-4 p-1 border-blue-500">
                  <img
                    src="https://github.com/yash131120/DBC_____logo/blob/main/sccqr.png?raw=true"
                    alt="SCC QR Code"
                    className="w-26 h-26 object-contain mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              className="flex-1 border-2 border-purple-400 text-purple-200 font-semibold py-2 sm:py-3 px-3 sm:px-6 rounded-xl hover:bg-purple-700 transition-all duration-200 text-xs sm:text-xs"
              onClick={() =>
                window.open("https://review.sccinfotech.com", "_blank")
              }
            >
              Visit: review.sccinfotech.com
            </button>
          </div>
          {/* AI Powered Attribution */}
          <div className="text-center pt-0 border-t border-indigo-700">
            {/* AI Powered Branding */}
            <a
              href="https://sccinfotech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-row items-center justify-center mt-3 mb-2 gap-3 cursor-pointer"
              title="Visit SCC INFOTECH LLP website"
            >
              <div className="w-14 h-14 relative perspective-1000">
                {/* 3D Rotating Ring - more visible */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-full animate-spin-continuous opacity-60 blur-[1px]"></div>
                <div className="absolute inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-spin-reverse opacity-40 blur-[1px]"></div>

                {/* Main Logo Container with 3D Effect */}
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-500 animate-float-gentle z-10">
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                    {/* Logo Display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src="https://review.sccinfotech.com/scc.png"
                        alt="SCC Logo"
                        className="w-8 h-8 animate-pulse-gentle object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Orbiting particles - more visible */}
                <div className="absolute inset-0 animate-spin-slow z-20">
                  <div className="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-purple-500 rounded-full opacity-80 animate-pulse delay-300"></div>
                  <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-pink-500 rounded-full opacity-80 animate-pulse delay-600"></div>
                  <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-cyan-500 rounded-full opacity-80 animate-pulse delay-900"></div>
                </div>
              </div>
              <div className="flex flex-col justify-between h-full">
                <span className="text-sm font-semibold text-indigo-100">
                  AI ✨ Powered
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  SCC INFOTECH LLP
                </span>
              </div>
            </a>
            <p className="text-xs text-indigo-300 mt-1">
              Transform Customer Feedback into Growth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reviewscard;
