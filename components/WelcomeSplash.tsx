"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function WelcomeSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const storageKey = "tracemind-welcome-shown";

    if (sessionStorage.getItem(storageKey)) {
      setShowWelcome(false);
      return;
    }

    sessionStorage.setItem(storageKey, "true");

    const timer = window.setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted || showWelcome) {
    return (
      <div className="welcome-splash">
        <div className="welcome-content">
          <div className="logo-wrapper">
            <div className="logo-ring" />

            <Image
              src="/tracemind-logo.png"
              alt="TraceMind"
              width={180}
              height={180}
              priority
              className="welcome-logo"
            />
          </div>

          <h1 className="welcome-title">
            Trace<span>Mind</span>
          </h1>

          <div className="title-line" />

          <p className="welcome-tagline">
            Never lose a thought, never forget a moment,
            find everything that matters.
          </p>

          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>

        <style jsx>{`
          .welcome-splash {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #050816;
            color: white;
          }

          .welcome-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px;
            text-align: center;
          }

          .logo-wrapper {
            position: relative;
            display: grid;
            place-items: center;
            width: 190px;
            height: 190px;
            animation: logoReveal 1.2s ease-out both;
          }

          .welcome-logo {
            width: 150px;
            height: 150px;
            object-fit: contain;
            filter: drop-shadow(0 0 25px #2563eb80);
          }

          .logo-ring {
            position: absolute;
            width: 170px;
            height: 170px;
            border: 1px solid #60a5fa70;
            border-radius: 50%;
            animation: ringPulse 2s ease-out infinite;
          }

          .welcome-title {
            display: flex;
            margin: 14px 0 0;
            font-size: clamp(42px, 7vw, 60px);
            font-weight: 800;
            letter-spacing: -2px;
            animation: riseIn 0.9s ease 0.5s both;
          }

          .welcome-title span {
            background: linear-gradient(90deg, #818cf8, #22d3ee);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
          }

          .title-line {
            width: 100px;
            height: 3px;
            margin-top: 14px;
            border-radius: 10px;
            background: linear-gradient(90deg, #818cf8, #22d3ee);
            animation: riseIn 0.8s ease 0.8s both;
          }

          .welcome-tagline {
            max-width: 430px;
            margin-top: 20px;
            color: #a5b4cc;
            font-size: 14px;
            line-height: 1.9;
            animation: riseIn 0.8s ease 1s both;
          }

          .loading-dots {
            display: flex;
            gap: 8px;
            margin-top: 32px;
          }

          .loading-dots span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #60a5fa;
            animation: bounce 1s infinite ease-in-out;
          }

          .loading-dots span:nth-child(2) {
            animation-delay: 0.15s;
          }

          .loading-dots span:nth-child(3) {
            animation-delay: 0.3s;
          }

          @keyframes logoReveal {
            from {
              opacity: 0;
              transform: scale(0.6);
              filter: blur(8px);
            }
            to {
              opacity: 1;
              transform: scale(1);
              filter: blur(0);
            }
          }

          @keyframes riseIn {
            from {
              opacity: 0;
              transform: translateY(15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes ringPulse {
            0% {
              transform: scale(0.8);
              opacity: 0.8;
            }
            100% {
              transform: scale(1.2);
              opacity: 0;
            }
          }

          @keyframes bounce {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.4;
            }
            30% {
              transform: translateY(-5px);
              opacity: 1;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .welcome-content *,
            .logo-ring {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}