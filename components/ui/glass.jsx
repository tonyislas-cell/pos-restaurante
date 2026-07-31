"use client";

import React from "react";
import Link from "next/link";

export const GlassEffect = ({
  children,
  className = "",
  style = {},
  href,
  target,
  onClick,
}) => {
  const glassStyle = {
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)", // Big floating drop shadows
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative overflow-hidden transition-all duration-700 rounded-3xl ${className}`}
      style={glassStyle}
      onClick={onClick}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit rounded-3xl pointer-events-none"
        style={{
          backdropFilter: "blur(1.5px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-inherit pointer-events-none"
        style={{ 
          background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)", // Frosty gradient
          borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
          borderLeft: "1.5px solid rgba(255, 255, 255, 0.4)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      />
      <div
        className="absolute inset-0 z-20 rounded-inherit rounded-3xl overflow-hidden pointer-events-none"
        style={{
          boxShadow:
            "inset 0 15px 15px -15px rgba(255, 255, 255, 0.8), inset 0 -15px 15px -15px rgba(0, 0, 0, 0.05)",
        }}
      />

      {/* Content */}
      <div className="relative z-30 h-full">{children}</div>
    </div>
  );

  if (href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className="block w-full h-full">
          {content}
        </Link>
      );
    }
    return (
      <a href={href} target={target} rel="noopener noreferrer" className="block w-full h-full">
        {content}
      </a>
    );
  }

  return content;
};

export const GlassFilter = () => (
  <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }} aria-hidden="true">
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.005 0.01"
        numOctaves="2"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="40"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);
