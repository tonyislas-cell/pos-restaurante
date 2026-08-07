"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

const MacOSDock = ({
  apps,
  onAppClick,
  openApps = [],
  className = "",
  pathname = "/",
}) => {
  const [mouseX, setMouseX] = useState(null);
  const [hoveredApp, setHoveredApp] = useState(null);
  const [currentScales, setCurrentScales] = useState(apps.map(() => 1));
  const [currentPositions, setCurrentPositions] = useState([]);
  const dockRef = useRef(null);
  const iconRefs = useRef([]);
  const animationFrameRef = useRef(undefined);
  const lastMouseMoveTime = useRef(0);

  // Responsive size calculations based on viewport
  const getResponsiveConfig = useCallback(() => {
    if (typeof window === "undefined") {
      return { baseIconSize: 64, maxScale: 1.6, effectWidth: 240 };
    }

    const smallerDimension = Math.min(window.innerWidth, window.innerHeight);

    if (smallerDimension < 480) {
      return {
        baseIconSize: Math.max(48, smallerDimension * 0.1),
        maxScale: 1.4,
        effectWidth: smallerDimension * 0.4,
      };
    } else if (smallerDimension < 768) {
      return {
        baseIconSize: Math.max(56, smallerDimension * 0.08),
        maxScale: 1.5,
        effectWidth: smallerDimension * 0.35,
      };
    } else {
      return {
        baseIconSize: 64,
        maxScale: 1.8,
        effectWidth: 300,
      };
    }
  }, []);

  const [config, setConfig] = useState(getResponsiveConfig);
  const { baseIconSize, maxScale, effectWidth } = config;
  const minScale = 1.0;
  // Aumentar el espaciado base a 16px o el 25% del tamaño base, para que no se junten las tarjetas
  const baseSpacing = Math.max(16, baseIconSize * 0.25);

  useEffect(() => {
    const handleResize = () => {
      setConfig(getResponsiveConfig());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getResponsiveConfig]);

  const calculateTargetMagnification = useCallback(
    (mousePosition) => {
      if (mousePosition === null) {
        return apps.map(() => minScale);
      }

      return apps.map((_, index) => {
        const normalIconCenter =
          index * (baseIconSize + baseSpacing) + baseIconSize / 2;
        const minX = mousePosition - effectWidth / 2;
        const maxX = mousePosition + effectWidth / 2;

        if (normalIconCenter < minX || normalIconCenter > maxX) {
          return minScale;
        }

        const theta = ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI;
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI);
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2;

        return minScale + scaleFactor * (maxScale - minScale);
      });
    },
    [apps, baseIconSize, baseSpacing, effectWidth, maxScale, minScale],
  );

  const calculatePositions = useCallback(
    (scales) => {
      let currentX = 0;

      return scales.map((scale) => {
        const scaledWidth = baseIconSize * scale;
        const centerX = currentX + scaledWidth / 2;
        currentX += scaledWidth + baseSpacing;
        return centerX;
      });
    },
    [baseIconSize, baseSpacing],
  );

  useEffect(() => {
    const initialScales = apps.map(() => minScale);
    const initialPositions = calculatePositions(initialScales);
    setCurrentScales(initialScales);
    setCurrentPositions(initialPositions);
  }, [apps, calculatePositions, minScale, config]);

  const animateToTarget = useCallback(() => {
    const targetScales = calculateTargetMagnification(mouseX);
    const targetPositions = calculatePositions(targetScales);
    const lerpFactor = mouseX !== null ? 0.2 : 0.12;

    setCurrentScales((prevScales) => {
      return prevScales.map((currentScale, index) => {
        const diff = targetScales[index] - currentScale;
        return currentScale + diff * lerpFactor;
      });
    });

    setCurrentPositions((prevPositions) => {
      return prevPositions.map((currentPos, index) => {
        const diff = targetPositions[index] - currentPos;
        return currentPos + diff * lerpFactor;
      });
    });

    const scalesNeedUpdate = currentScales.some(
      (scale, index) => Math.abs(scale - targetScales[index]) > 0.002,
    );
    const positionsNeedUpdate = currentPositions.some(
      (pos, index) => Math.abs(pos - targetPositions[index]) > 0.1,
    );

    if (scalesNeedUpdate || positionsNeedUpdate || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget);
    }
  }, [
    mouseX,
    calculateTargetMagnification,
    calculatePositions,
    currentScales,
    currentPositions,
  ]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateToTarget);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateToTarget]);

  const handleMouseMove = useCallback(
    (e) => {
      const now = performance.now();

      if (now - lastMouseMoveTime.current < 16) {
        return;
      }

      lastMouseMoveTime.current = now;

      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        const padding = Math.max(12, baseIconSize * 0.15);
        setMouseX(e.clientX - rect.left - padding);
      }
    },
    [baseIconSize],
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
    setHoveredApp(null);
  }, []);

  const createBounceAnimation = (element) => {
    const bounceHeight = Math.max(-12, -baseIconSize * 0.2);
    element.style.transition = "transform 0.2s ease-out";
    element.style.transform = `translateY(${bounceHeight}px)`;

    setTimeout(() => {
      element.style.transform = "translateY(0px)";
    }, 200);
  };

  const handleAppClick = (appId, index) => {
    if (iconRefs.current[index]) {
      createBounceAnimation(iconRefs.current[index]);
    }
    onAppClick(appId);
  };

  const contentWidth =
    currentPositions.length > 0
      ? Math.max(
          ...currentPositions.map(
            (pos, index) => pos + (baseIconSize * currentScales[index]) / 2,
          ),
        )
      : apps.length * (baseIconSize + baseSpacing) - baseSpacing;

  const padding = Math.max(12, baseIconSize * 0.15);

  return (
    <div
      ref={dockRef}
      className={`backdrop-blur-3xl ${className}`}
      style={{
        width: `${contentWidth + padding * 2}px`,
        background: "rgba(255, 255, 255, 0.6)",
        borderRadius: `${Math.max(16, baseIconSize * 0.4)}px`,
        border: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: `
          0 ${Math.max(8, baseIconSize * 0.1)}px ${Math.max(24, baseIconSize * 0.4)}px rgba(0, 0, 0, 0.15),
          0 ${Math.max(4, baseIconSize * 0.05)}px ${Math.max(12, baseIconSize * 0.2)}px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.8)
        `,
        padding: `${padding}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{
          height: `${baseIconSize}px`,
          width: "100%",
        }}
      >
        {apps.map((app, index) => {
          const scale = currentScales[index];
          const position = currentPositions[index] || 0;
          const scaledSize = baseIconSize * scale;
          const Icon = app.icon;
          
          const isActive =
            app.id === "/" ? pathname === "/" : pathname.startsWith(app.id);

          return (
            <div
              key={app.id}
              className="absolute flex flex-col items-center justify-end"
              style={{
                left: `${position - scaledSize / 2}px`,
                bottom: "0px",
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                zIndex: Math.round(scale * 10),
              }}
            >
              {/* Tooltip gigante al pasar el mouse */}
              {hoveredApp === app.id && (
                <div 
                  className="absolute bottom-full mb-6 whitespace-nowrap bg-ink text-surface px-5 py-2 rounded-xl text-2xl font-bold shadow-xl border border-line/20 pointer-events-none"
                  style={{ zIndex: 100 }}
                >
                  {app.name}
                  {/* Flechita del tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-ink"></div>
                </div>
              )}

              <div
                ref={(el) => {
                  iconRefs.current[index] = el;
                }}
                className={`flex cursor-pointer items-center justify-center rounded-2xl border-2 transition-colors ${
                  isActive
                    ? "bg-brand text-ink border-brand/50 shadow-md"
                    : "bg-surface text-ink border-line/50 hover:text-brand hover:border-brand/40 shadow-sm"
                }`}
                onClick={() => handleAppClick(app.id, index)}
                onMouseEnter={() => setHoveredApp(app.id)}
                style={{
                  width: "100%",
                  height: "100%",
                  transformOrigin: "bottom center",
                }}
              >
                <Icon size={scaledSize * 0.55} strokeWidth={isActive ? 2 : 1.5} />
              </div>

              {/* Punto indicador de la app activa */}
              {isActive && (
                <div
                  className="absolute"
                  style={{
                    bottom: `${Math.max(-8, -baseIconSize * 0.1)}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: `${Math.max(4, baseIconSize * 0.08)}px`,
                    height: `${Math.max(4, baseIconSize * 0.08)}px`,
                    borderRadius: "50%",
                    backgroundColor: "rgba(28, 24, 20, 0.8)",
                    boxShadow: "0 0 4px rgba(255, 255, 255, 0.5)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MacOSDock;
