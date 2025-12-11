"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type Problem = {
  id: number;
  value: string;
  answer: number;
  y: number;
  active: boolean;
};


// --- New states for lives & game over ---

type ScoreEffect = {
  id: number;
  value: number;
  x: number;
  y: number;
  createdAt: number;
};

type LivesLossEffect = {
  id: number;
  x: number;
  y: number;
  createdAt: number;
};

type ExplosionEffect = {
  id: number;
  createdAt: number;
};

type ConfettiParticle = {
  id: number;
  x: number;
  y: number;
  color: string;
};

type ConfettiEffect = {
  id: number;
  x: number;
  y: number;
  particles: ConfettiParticle[];
  createdAt: number;
};

type LaserEffect = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  createdAt: number;
};

export default function MathRocketDefender() {
  const [operation, setOperation] = useState<"+" | "-" | "*" | "/" | "all">("all");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [input, setInput] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const isMobileDevice = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // --- New states for lives & game over ---
  const [lives, setLives] = useState(5);
  const [gameOver, setGameOver] = useState(false);

  // Animation states
  const [scoreEffects, setScoreEffects] = useState<ScoreEffect[]>([]);
  const [livesLossEffects, setLivesLossEffects] = useState<LivesLossEffect[]>([]);
  const [explosionEffects, setExplosionEffects] = useState<ExplosionEffect[]>([]);
  const [confettiEffects, setConfettiEffects] = useState<ConfettiEffect[]>([]); //New
  const [laserEffects, setLaserEffects] = useState<LaserEffect[]>([]); //New

  // High scores for each operation and difficulty
  const [highScores, setHighScores] = useState<Record<string, number>>({
    "+_easy": 0,
    "-_easy": 0,
    "*_easy": 0,
    "/_easy": 0,
    "all_easy": 0,
    "+_medium": 0,
    "-_medium": 0,
    "*_medium": 0,
    "/_medium": 0,
    "all_medium": 0,
    "+_hard": 0,
    "-_hard": 0,
    "*_hard": 0,
    "/_hard": 0,
    "all_hard": 0,
  });

  // Track active timeouts for cleanup
  const activeTimeouts = useRef<Set<number>>(new Set());
  const problemInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup function to clear all active timeouts
  const clearAllTimeouts = useCallback(() => {
    activeTimeouts.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    activeTimeouts.current.clear();

    if (problemInterval.current) {
      clearInterval(problemInterval.current);
      problemInterval.current = null;
    }
  }, []);

  // Helper function to track timeouts
  const setTrackedTimeout = useCallback((callback: () => void, delay: number): number => {
    const timeoutId = window.setTimeout(() => {
      callback();
      activeTimeouts.current.delete(timeoutId);
    }, delay);
    activeTimeouts.current.add(timeoutId);
    return timeoutId;
  }, []);

  // Generate a random problem based on difficulty
  const generateProblem = useCallback(() => {
    const ops = operation === "all" ? ["+", "-", "*", "/"] : [operation];
    const op = ops[Math.floor(Math.random() * ops.length)];

    // Define number ranges based on difficulty
    let a, b;

    if (difficulty === "easy") {
      // Easy: 1-digit vs 1-digit only (1-9 vs 1-9)
      a = Math.floor(Math.random() * 9) + 1; // 1-9
      b = Math.floor(Math.random() * 9) + 1; // 1-9
    } else if (difficulty === "medium") {
      // Medium: 1-digit vs 2-digit OR 2-digit vs 2-digit
      const mediumChoice = Math.random();
      if (mediumChoice < 0.5) {
        // 1-digit vs 2-digit (1-9 vs 10-99) - randomly decide which is which
        if (Math.random() < 0.5) {
          a = Math.floor(Math.random() * 9) + 1; // 1-9
          b = Math.floor(Math.random() * 90) + 10; // 10-99
        } else {
          a = Math.floor(Math.random() * 90) + 10; // 10-99
          b = Math.floor(Math.random() * 9) + 1; // 1-9
        }
      } else {
        // 2-digit vs 2-digit (10-99 vs 10-99)
        a = Math.floor(Math.random() * 90) + 10; // 10-99
        b = Math.floor(Math.random() * 90) + 10; // 10-99
      }
    } else {
      // Hard: 3-digit vs 3-digit (100–999)
      a = Math.floor(Math.random() * 900) + 100; // 100-999
      b = Math.floor(Math.random() * 900) + 100; // 100-999
    }

    if (op === "/") {
      // For division, ensure result is a whole number
      if (difficulty === "easy") {
        // For easy division, use 1-digit numbers
        a = a * b;
      } else if (difficulty === "medium") {
        // For medium division - handle both cases appropriately
        if ((a > 9 && a < 100) && (b > 9 && b < 100)) {
          // 2-digit vs 2-digit: ensure result is reasonable
          let divisor = Math.floor(Math.random() * 90) + 10; // 10-99
          let quotient = Math.floor(Math.random() * 9) + 1; // 1-9
          a = divisor * quotient;
          b = divisor;
        } else {
          // 1-digit vs 2-digit: adjust for easier problem
          let divisor = Math.floor(Math.random() * 9) + 1; // 1-9
          let quotient = Math.floor(Math.random() * 9) + 1; // 1-9
          a = divisor * quotient;
          b = divisor;
        }
      } else {
        // For hard division, make it more complex but reasonable
        let divisor = Math.floor(Math.random() * 90) + 10; // 10-99
        let quotient = Math.floor(Math.random() * 90) + 10; // 10-99
        a = divisor * quotient;
        b = divisor;
      }
    }

    const value = `${a} ${op} ${b}`;
    const answer = eval(value);
    return {
      id: Date.now() + Math.random(),
      value,
      answer,
      y: -50,
      active: false,
    };
  }, [operation, difficulty]);

  // Add new problem periodically
  useEffect(() => {
    if (!gameStarted) return;
    problemInterval.current = setInterval(() => {
      setProblems((prev) => {
        const newProblem = {
          ...generateProblem(),
          active: false,
        };
        const updated = [...prev, newProblem];
        return updated.map((p, index) => ({
          ...p,
          active: index === 0,
        }));
      });
    }, 2000);
    return () => {
      if (problemInterval.current) {
        clearInterval(problemInterval.current);
        problemInterval.current = null;
      }
    };
  }, [gameStarted, operation, generateProblem]);

  // Move problems down
  useEffect(() => {
    if (!gameStarted) return;
    let animationFrameId: number;
    const animation = () => {
      // Calculate the actual height of the game container
      const gameContainer = document.querySelector('.h-\\[calc\\(100vh-120px\\)\\]') as HTMLElement;
      const gameHeight = gameContainer ? gameContainer.clientHeight : window.innerHeight * 0.8;

      // The rocket is positioned with bottom-16 (64px from bottom) and has height 80px
      // So the tip of the rocket (where collision happens) is at: gameHeight - 64px - 80px = gameHeight - 144px
      const rocketTopY = gameHeight - 96 - 80; // gameHeight - bottom_offset - rocket_height

      // Track if we already lost a life in this frame
      let didLoseLife = false;

      setProblems((prev) => {
        // First, update all problem positions
        const problemsWithNewPositions = prev.map((p) => ({
          ...p,
          y: p.y + Math.floor(window.innerHeight * 0.002)
        }));

        // Find the first problem that should cause a life loss (if any)
        let problemToLoseLifeFor = null;
        for (const problem of problemsWithNewPositions) {
          if (problem.y >= rocketTopY && !didLoseLife) {
            didLoseLife = true;
            problemToLoseLifeFor = problem.id;
            break;
          }
        }

        // If we found a problem that should cause a life loss, update the state
        if (didLoseLife && problemToLoseLifeFor) {
          // Create lives loss effect at the lives counter position
          const newLivesLossEffect = {
            id: Date.now(),
            x: 100, // x position aligned with lives counter (left side)
            y: 60,  // y position aligned with lives counter
            createdAt: Date.now()
          };
          setLivesLossEffects(prev => [...prev, newLivesLossEffect]);

          // Create explosion effect at the same position as the rocket
          const newExplosionEffect = {
            id: Date.now(),
            createdAt: Date.now()
          };
          setExplosionEffects(prev => [...prev, newExplosionEffect]);

          // Remove old lives loss effects to avoid memory issues
          setTrackedTimeout(() => {
            setLivesLossEffects(current => current.filter(effect => effect.id !== newLivesLossEffect.id));
          }, 1000); // Expire after 1 second

          // Remove old explosion effects to avoid memory issues
          setTrackedTimeout(() => {
            setExplosionEffects(current => current.filter(effect => effect.id !== newExplosionEffect.id));
          }, 1000); // Expire after 1 second

          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              // Update high score before ending the game
              const scoreKey = `${operation}_${difficulty}`;
              if (score > highScores[scoreKey]) {
                setHighScores(prev => ({
                  ...prev,
                  [scoreKey]: score
                }));
              }
              // Create a final lives loss effect to show game over effect
              const gameOverEffect = {
                id: Date.now(),
                x: 100, // x position aligned with lives counter (left side)
                y: 60,  // y position aligned with lives counter
                createdAt: Date.now()
              };
              setLivesLossEffects(prev => [...prev, gameOverEffect]);

              // Create a final explosion effect for game over
              const gameExplosionEffect = {
                id: Date.now(),
                createdAt: Date.now()
              };
              setExplosionEffects(prev => [...prev, gameExplosionEffect]);

              // Only set game over after the explosion animation completes
              setTrackedTimeout(() => {
                setGameOver(true);
                setGameStarted(false);
                setProblems([]);
              }, 1000); // Wait for explosion animation to complete

              // Remove game over effect after delay
              setTrackedTimeout(() => {
                setLivesLossEffects(current => current.filter(effect => effect.id !== gameOverEffect.id));
              }, 1000);

              // Remove game over explosion effect after delay
              setTrackedTimeout(() => {
                setExplosionEffects(current => current.filter(effect => effect.id !== gameExplosionEffect.id));
              }, 2000); // Keep explosion for a bit longer to allow for visual completion

              return 5; // reset lives on game over
            }
            return newLives;
          });
        }

        // Filter out problems that should be removed (hit the rocket)
        const updated = problemsWithNewPositions.filter((p) => {
          // Remove problem if it has hit the rocket
          if (p.y >= rocketTopY) {
            return false;
          }
          return true; // keep problem that hasn't reached the rocket yet
        });

        if (updated.length > 0) {
          updated[0].active = true;
        }
        return updated;
      });
      animationFrameId = requestAnimationFrame(animation);
    };
    animationFrameId = requestAnimationFrame(animation);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted]);


  // Handle input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(input);
    if (isNaN(num)) {
      setInput("");
      return;
    }
    const active = problems.find((p) => p.active);
    if (!active) {
      setInput("");
      return;
    }
    if (num === active.answer) {
      // Calculate game container height to determine rocket position
      const gameContainer = document.querySelector('.h-\\[calc\\(100vh-64px\\)\\]') as HTMLElement;
      const gameHeight = gameContainer ? gameContainer.clientHeight : window.innerHeight * 0.8;
      const rocketY = gameHeight - 96 - 80; // Rocket bottom position minus full rocket height (80px), so we get the top

      // Add laser effect from rocket head to problem
      const newLaserEffect = {
        id: Date.now(),
        startX: window.innerWidth / 2, // Rocket is centered
        startY: rocketY, // Top of the rocket
        endX: window.innerWidth / 2, // Problem is centered
        endY: active.y,
        createdAt: Date.now()
      };
      setLaserEffects(prev => [...prev, newLaserEffect]);

      // Remove laser effect after animation (short duration)
      setTrackedTimeout(() => {
        setLaserEffects(current => current.filter(le => le.id !== newLaserEffect.id));
      }, 150); // Laser animation is fast

      // Add score effect after laser hits the problem
      setTrackedTimeout(() => {
        setScore((s) => s + 1);

        // Add score effect at the score indicator position (top-right)
        const newScoreEffect = {
          id: Date.now(),
          value: 1, // Points awarded
          x: window.innerWidth - 80, // x position aligned with score counter (top-right)
          y: 60,  // y position aligned with score counter
          createdAt: Date.now()
        };
        setScoreEffects(prev => [...prev, newScoreEffect]);

        // Remove score effect after animation
        setTrackedTimeout(() => {
          setScoreEffects(current => current.filter(se => se.id !== newScoreEffect.id));
        }, 1000);

        // Add confetti effect at the problem's current position
        const confettiParticles = Array.from({ length: 15 }, (_, i) => {
          // Random angle in radians
          const angle = Math.random() * Math.PI * 2;
          // Random distance
          const distance = 30 + Math.random() * 50;
          // Random color for confetti
          const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
          const color = colors[Math.floor(Math.random() * colors.length)];

          return {
            id: Date.now() + i,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            color
          };
        });

        const newConfettiEffect = {
          id: Date.now(),
          x: window.innerWidth / 2, // Since all problems are centered
          y: active.y, // Use the problem's current y position
          particles: confettiParticles,
          createdAt: Date.now()
        };
        setConfettiEffects(prev => [...prev, newConfettiEffect]);

        // Remove confetti effect after animation
        setTrackedTimeout(() => {
          setConfettiEffects(current => current.filter(ce => ce.id !== newConfettiEffect.id));
        }, 1500);
      }, 150); // Delay score/confetti until after laser animation

      // Remove the problem after a short delay to allow laser to "hit" it first
      setTrackedTimeout(() => {
        setProblems((prev) => {
          const newProblems = prev.filter((p) => p.id !== active.id);
          if (newProblems.length > 0) {
            newProblems[0].active = true;
          }
          return newProblems;
        });
      }, 170); // Slightly longer than laser animation
    } else {
      // incorrect: shake input
      const el = document.getElementById("answer-input");
      if (el) el.classList.add("shake");
      setTrackedTimeout(() => {
        if (el) el.classList.remove("shake");
      }, 500);
    }
    setInput("");
  };  // end of handleSubmit

  // Handle digit input
  const handleDigitInput = (digit: string) => {
    setInput(prev => prev + digit);
  };

  // Handle backspace
  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  // Handle negative sign
  const handleNegative = () => {
    if (input === '') {
      setInput('-');
    }
  };

  // Handle submit
  const handleSubmitCustom = () => {
    // Call the original handleSubmit function
    const submitEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(submitEvent);
    // Keep the keyboard open after submission
  };

  return (
    <div className="relative w-full mx-auto max-w-4xl h-[calc(100vh-120px)] bg-black text-white overflow-hidden">
      {/* Space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-black"></div>

      {/* Rocket */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
        <svg
          width="50"
          height="80"
          viewBox="0 0 50 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Nose cone - triangle at top */}
          <polygon points="25,0 15,20 35,20" fill="#E11D48" /> {/* Red-600 */}
          {/* Main body - rectangle */}
          <rect x="10" y="20" width="30" height="40" fill="#1E40AF" /> {/* Blue-700 */}
          {/* Cabin section - slightly different pattern to make it look more like a cabin */}
          <rect x="12" y="25" width="26" height="30" fill="#3B82F6" /> {/* Blue-500 */}
          {/* Window - circle in the middle of cabin */}
          <circle cx="25" cy="40" r="6" fill="#BFDBFE" stroke="#93C5FD" stroke-width="1"/> {/* Light blue-200 with border */}
          {/* Left fin */}
          <polygon points="10,50 0,70 10,70" fill="#60A5FA" /> {/* Blue-400 */}
          {/* Right fin */}
          <polygon points="40,50 50,70 40,70" fill="#60A5FA" /> {/* Blue-400 */}
          {/* Bottom center fin */}
          <polygon points="20,70 30,70 25,80" fill="#60A5FA" /> {/* Blue-400 */}
          {/* Engine exhaust/fire effect - animated */}
          <path d="M20,70 Q25,75 30,70 Q25,80 20,70" fill="#F59E0B" className="thrust-animation" /> {/* Yellow-500 */}
          <path d="M18,72 Q25,78 32,72 Q25,82 18,72" fill="#EF4444" className="thrust-animation" /> {/* Red-500 */}
        </svg>
      </div>
      {/* Laser Effects - shoot from rocket to problem */}
      {laserEffects.map((effect) => (
        <div
          key={effect.id}
          className="absolute pointer-events-none laser-beam"
          style={{
            left: '50%',
            top: `${effect.endY}px`,
            width: '4px',
            height: `${effect.startY - effect.endY}px`,
            backgroundColor: '#3B82F6',
            transform: 'translateX(-50%)',
          }}
        />
      ))}

      {/* Confetti Effects - appear where problems are solved */}
      {confettiEffects.map((effect) => (
        <div
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: `${effect.y}px`,
            transform: 'translate(-50%)',
          }}
        >
          {effect.particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: particle.color,
                left: '0px',
                top: '0px',
                width: '8px',
                height: '8px',
                animation: `confettiParticleAnimation 1.5s forwards`,
                '--final-x': `${particle.x}px`,
                '--final-y': `${particle.y}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ))}

      {/* Problems */}
      {problems.map((p) => (
        <div
          key={p.id}
          className={`absolute left-1/2 transform -translate-x-1/2 text-2xl md:text-xl tablet-text-lg font-bold transition-all duration-300 ${
            p.active ? "text-orange-400 scale-110" : "text-white"
          }`}
          style={{
            top: `${p.y}px`,
            transition: p.active ? 'transform 0.1s ease, text-shadow 0.1s ease' : 'none'
          }}
        >
          {p.value}
        </div>
      ))}

      {/* Input */}
      {/* Explosion Effects - appear where problems hit the rocket */}
      {explosionEffects.map((effect) => (
        <div
          key={effect.id}
          className="absolute pointer-events-none animate-explosion"
          style={{
            left: '50%',
            bottom: '120px',
            transform: 'translate(-50%, 50%)',
          }}
        >
          <div className="w-12 h-12 rounded-full border-4 border-red-500 opacity-80"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-yellow-400 opacity-60 animate-ping"></div>
        </div>
      ))}

      {/* Score Effects - appear near the score display */}
      {scoreEffects.map((effect) => (
        <div
          key={effect.id}
          className="absolute pointer-events-none text-green-400 font-bold text-xl animate-scoreRise"
          style={{
            right: '20px',  // Positioned to the right of the score counter
            top: '48px',     // Aligned with the score
            transform: 'translateX(0)',
          }}
        >
          +{effect.value}
        </div>
      ))}

      {/* Input */}
      {isMobileDevice ? (
        <>
          {/* Hidden input for form submission */}
          <input
            id="answer-input"
            type="text"
            value={input}
            readOnly
            className="absolute opacity-0 w-0 h-0"
            aria-hidden="true"
          />
          {/* Hidden input for form submission */}
          <input
            id="answer-input"
            type="text"
            value={input}
            readOnly
            className="absolute opacity-0 w-0 h-0"
            aria-hidden="true"
          />
          {/* Show a button to open the keyboard on mobile */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 cursor-pointer z-10"
            onClick={() => setShowKeyboard(true)}
          >
            <input
              type="text"
              value={input}
              readOnly
              placeholder={input ? "Tap to edit answer" : "Tap to open keyboard"}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out"
            />
          </div>
          {/* Show keyboard if explicitly shown */}
          {showKeyboard && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-11/12 max-w-[90%] bg-gray-800 p-1 rounded-t-none rounded-b-lg shadow-lg z-30">
              <div className="flex justify-between mb-1">
                <div className="flex-1 p-2 bg-gray-700 rounded text-center text-white overflow-x-auto whitespace-nowrap">
                  {input || "Enter answer..."}
                </div>
                <button
                  onClick={() => setShowKeyboard(false)}
                  className="text-white text-base w-5 h-5 flex items-center justify-center hover:bg-gray-700 rounded ml-1"
                >
                  ✕
                </button>
              </div>
              <div className="flex justify-between gap-1 mb-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                  <button
                    key={num}
                    onClick={() => handleDigitInput(num.toString())}
                    className="bg-gray-700 text-white p-1 rounded text-xs hover:bg-gray-600 active:bg-gray-500 flex-1"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between gap-1">
                <button
                  onClick={handleNegative}
                  className="bg-gray-700 text-white p-1.5 rounded text-sm hover:bg-gray-600 active:bg-gray-500 flex-1 text-center"
                >
                  -
                </button>
                <button
                  onClick={handleBackspace}
                  className="bg-red-600 text-white p-1.5 rounded text-sm hover:bg-red-500 active:bg-red-400 flex-1 text-center"
                >
                  ⌫
                </button>
                <button
                  onClick={handleSubmitCustom}
                  className="bg-green-600 text-white p-1.5 rounded text-sm hover:bg-green-500 active:bg-green-400 flex-1 text-center"
                >
                  ✓
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Desktop: Keep the original form with input
        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2"
        >
          <input
            id="answer-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Answer"
            autoComplete="off"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out"
          />
        </form>
      )}

      {/* Back button – visible only while the game is active */}
      {gameStarted && !gameOver && (
        <button
          onClick={() => {
            setGameStarted(false);
            setProblems([]);
            setScore(0);
            setLives(5);
            setGameOver(false);
            // Reset all effect arrays to prevent visual artifacts
            setScoreEffects([]);
            setLivesLossEffects([]);
            setExplosionEffects([]);
            setConfettiEffects([]);
            setLaserEffects([]);
            clearAllTimeouts(); // Clear all active timeouts
          }}
          className="absolute top-4 left-4 z-10 text-white bg-transparent border border-white rounded px-2 py-1 text-sm tablet-text-base"
        >
          Back
        </button>
      )}
      {/* Score */}
      <div className="absolute top-12 right-4 text-xl md:text-lg tablet-text-base text-orange-400">
        Score: {score}
      </div>
      <div className="absolute top-4 right-4 text-xl md:text-lg tablet-text-base text-green-400">
        High Score: {highScores[`${operation}_${difficulty}`]}
      </div>

      {/* Lives */}
      <div className="absolute top-12 left-4 text-xl md:text-lg tablet-text-base text-red-500">
        Lives: {lives}
      </div>

      {/* Start button & operation selection */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-30">
          <h1 className="text-5xl mb-2 font-bold -mt-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Math Blast</h1>
          <p className="text-lg mb-6 text-center text-gray-300">A playful 2D math shooter where rockets hit falling math questions.</p>
          <label className="mb-2 text-lg">Choose your Operation</label>
          <select
            value={operation}
            onChange={(e) =>
              setOperation(e.target.value as "+" | "-" | "*" | "/" | "all")
            }
            className="mb-6 p-2 rounded bg-gray-800 text-white border border-gray-600"
          >
            <option value="all">All</option>
            <option value="+">Addition (+)</option>
            <option value="-">Subtraction (-)</option>
            <option value="*">Multiplication (*)</option>
            <option value="/">Division (/)</option>
          </select>
          {/* Difficulty Selector */}
          <div className="mb-6 flex gap-2 justify-center">
            <div className={`difficulty-option cursor-pointer px-3 py-1.5 rounded-md transition-all duration-200 text-sm ${difficulty === "easy" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                 onClick={() => setDifficulty("easy")}>
              Easy
            </div>
            <div className={`difficulty-option cursor-pointer px-3 py-1.5 rounded-md transition-all duration-200 text-sm ${difficulty === "medium" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                 onClick={() => setDifficulty("medium")}>
              Medium
            </div>
            <div className={`difficulty-option cursor-pointer px-3 py-1.5 rounded-md transition-all duration-200 text-sm ${difficulty === "hard" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                 onClick={() => setDifficulty("hard")}>
              Hard
            </div>
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="p-3 rounded-md bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-base hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Game Over overlay */}
      {gameOver && (() => {
        const scoreKey = `${operation}_${difficulty}`;
        const effectiveHighScore = score > highScores[scoreKey] ? score : highScores[scoreKey];
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-red-500 text-3xl md:text-2xl tablet-text-xl font-bold">
            <div className="mb-4 text-green-400">High Score: {effectiveHighScore}</div>
            <div className="mb-10 text-orange-400">Score: {score}</div>
            <div className="mb-4 text-5xl md:text-4xl tablet-text-3xl font-bold text-red-500">Game Over</div>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm tablet-text-base"
              onClick={() => {
                // Update high score if current score is higher
                if (score > highScores[scoreKey]) {
                  setHighScores(prev => ({
                    ...prev,
                    [scoreKey]: score
                  }));
                }
                // Clear all active timeouts before restarting
                clearAllTimeouts();
                // Reset all effect arrays to prevent visual artifacts
                setScoreEffects([]);
                setLivesLossEffects([]);
                setExplosionEffects([]);
                setConfettiEffects([]);
                setLaserEffects([]);
                setGameStarted(true);
                setGameOver(false);
                setLives(5);
                setProblems([]);
                setScore(0);
              }}
            >
              Restart
            </button>
          </div>
        );
      })()}

      {/* Lives Loss Effects - appear near the lives display */}
      {livesLossEffects.map((effect) => (
        <div
          key={effect.id}
          className="absolute pointer-events-none text-red-500 font-bold text-xl animate-livesLoss"
          style={{
            left: '90px',  // Positioned to the right of the lives counter
            top: '48px',    // Aligned with the lives counter
            transform: 'translateX(-50%)',
          }}
        >
          -1
        </div>
      ))}

      <style jsx>{`
        .shake {
          animation: shake 0.5s;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }

        @keyframes explosion {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        @keyframes thrust-flicker {
          0% { opacity: 0.8; transform: scaleY(1); }
          100% { opacity: 1; transform: scaleY(1.1); }
        }

        .thrust-animation {
          animation: thrust-flicker 0.5s infinite alternate;
        }

        .animate-scoreRise {
          animation: scoreRise 1s forwards;
        }

        @keyframes scoreRise {
          0% {
            transform: translate(-50%, -100%);
            opacity: 1;
            margin-top: 0;
          }
          100% {
            transform: translate(-50%, -200%);
            opacity: 0;
            margin-top: -50px;
          }
        }

        .animate-livesLoss {
          animation: livesLossRise 1s forwards;
        }

        @keyframes livesLossRise {
          0% {
            transform: translate(-50%, -100%);
            opacity: 1;
            margin-top: 0;
          }
          100% {
            transform: translate(-50%, -200%);
            opacity: 0;
            margin-top: -50px;
          }
        }

        @keyframes confettiParticleAnimation {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--final-x, 0), var(--final-y, 0)) scale(0) rotate(360deg);
            opacity: 0;
          }
        }

        .laser-beam {
          box-shadow: 0 0 8px #3B82F6, 0 0 16px #3B82F6;
          animation: laserPulse 0.15s ease-in-out;
        }

        @keyframes laserPulse {
          0% {
            opacity: 0;
            box-shadow: 0 0 0px #3B82F6;
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 10px #3B82F6, 0 0 20px #3B82F6;
          }
          100% {
            opacity: 0.8;
            box-shadow: 0 0 8px #3B82F6, 0 0 16px #3B82F6;
          }
        }
        /* Difficulty option button styles */
        .difficulty-option {
          min-width: 60px;
          text-align: center;
          font-weight: 500;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .difficulty-option.active {
          border-color: #3B82F6;
          background-color: #3B82F6;
          color: white;
        }

        @media (max-width: 1000px) {
          .tablet-text-base {
            font-size: 1rem;
          }
          .tablet-text-lg {
            font-size: 1.125rem;
          }
          .tablet-text-xl {
            font-size: 1.25rem;
          }
          .tablet-text-2xl {
            font-size: 1.5rem;
          }
          .tablet-text-3xl {
            font-size: 1.875rem;
          }
          .tablet-text-4xl {
            font-size: 2.25rem;
          }
        }

        @media (max-width: 640px) {
          .difficulty-option {
            min-width: 50px;
            padding: 6px 10px;
            font-size: 0.8rem;
          }
        }
        `}</style>
    </div>
  );
}
