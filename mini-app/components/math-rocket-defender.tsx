"use client";

import { useEffect, useState, useCallback } from "react";

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

export default function MathRocketDefender() {
  const [operation, setOperation] = useState<"+" | "-" | "*" | "/" | "all">("all");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // --- New states for lives & game over ---
  const [lives, setLives] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [highScores, setHighScores] = useState<Record<string, number>>({
    '+': 0,
    '-': 0,
    '*': 0,
    '/': 0,
    'all': 0,
  });
  const [scoreEffects, setScoreEffects] = useState<ScoreEffect[]>([]);
  const [livesLossEffects, setLivesLossEffects] = useState<LivesLossEffect[]>([]);
  const [explosionEffects, setExplosionEffects] = useState<ExplosionEffect[]>([]);

  // Generate a random problem
  const generateProblem = useCallback(() => {
    const ops = operation === "all" ? ["+", "-", "*", "/"] : [operation];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    if (op === "/") {
      a = a * b;
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
  }, [operation]);

  // Add new problem periodically
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
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
    return () => clearInterval(interval);
  }, [gameStarted, operation, generateProblem]);

  // Move problems down
  useEffect(() => {
    if (!gameStarted) return;
    let animationFrameId: number;
    const animation = () => {
      // Calculate the actual height of the game container
      const gameContainer = document.querySelector('.h-\\[calc\\(100vh-64px\\)\\]') as HTMLElement;
      const gameHeight = gameContainer ? gameContainer.clientHeight : window.innerHeight * 0.8;

      // The rocket is positioned with bottom-16 (64px from bottom) and has height 80px
      // So the tip of the rocket (where collision happens) is at: gameHeight - 64px - 80px = gameHeight - 144px
      const rocketTopY = gameHeight - 64 - 80; // gameHeight - bottom_offset - rocket_height

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
          setTimeout(() => {
            setLivesLossEffects(current => current.filter(effect => effect.id !== newLivesLossEffect.id));
          }, 1000); // Expire after 1 second

          // Remove old explosion effects to avoid memory issues
          setTimeout(() => {
            setExplosionEffects(current => current.filter(effect => effect.id !== newExplosionEffect.id));
          }, 1000); // Expire after 1 second

          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              // Update high score before ending the game
              if (score > highScores[operation]) {
                setHighScores(prev => ({
                  ...prev,
                  [operation]: score
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

              // Remove game over effect after delay
              setTimeout(() => {
                setLivesLossEffects(current => current.filter(effect => effect.id !== gameOverEffect.id));
              }, 1000);

              // Remove game over explosion effect after delay
              setTimeout(() => {
                setExplosionEffects(current => current.filter(effect => effect.id !== gameExplosionEffect.id));
              }, 1000);

              setGameOver(true);
              setGameStarted(false);
              setProblems([]);
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

  // Update high score whenever score changes for the current operation
  useEffect(() => {
    if (score > highScores[operation]) {
      setHighScores((prev) => ({
        ...prev,
        [operation]: score,
      }));
    }
  }, [score, operation, highScores]);

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
      // correct - add score effect and remove the problem
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
      setTimeout(() => {
        setScoreEffects(current => current.filter(se => se.id !== newScoreEffect.id));
      }, 1000);

      setProblems((prev) => {
        const newProblems = prev.filter((p) => p.id !== active.id);
        if (newProblems.length > 0) {
          newProblems[0].active = true;
        }
        return newProblems;
      });
    } else {
      // incorrect: shake input
      const el = document.getElementById("answer-input");
      if (el) el.classList.add("shake");
      setTimeout(() => {
        if (el) el.classList.remove("shake");
      }, 500);
    }
    setInput("");
  };

  return (
    <div className="relative w-full mx-auto max-w-4xl h-[calc(100vh-64px)] bg-black text-white overflow-hidden">
      {/* Space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-black"></div>

      {/* Rocket */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
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

      {/* Problems */}
      {problems.map((p) => (
        <div
          key={p.id}
          className={`absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold ${
            p.active ? "text-orange-400" : "text-white"
          }`}
          style={{ top: `${p.y}px` }}
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
            bottom: '90px',
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

      {/* Back button – visible only while the game is active */}
      {gameStarted && !gameOver && (
        <button
          onClick={() => {
            setGameStarted(false);
            setProblems([]);
            setScore(0);
            setLives(5);
            setGameOver(false);
          }}
          className="absolute top-4 left-4 z-10 text-white bg-transparent border border-white rounded px-2 py-1"
        >
          Back
        </button>
      )}
      {/* Score */}
      <div className="absolute top-12 right-4 text-xl text-orange-400">
        Score: {score}
      </div>
      <div className="absolute top-4 right-4 text-xl text-green-400">
        High Score: {highScores[operation]}
      </div>

      {/* Lives */}
      <div className="absolute top-12 left-4 text-xl text-red-500">
        Lives: {lives}
      </div>

      {/* Start button & operation selection */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-5xl mb-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Math Blast</h1>
          <p className="text-lg mb-4 text-center text-gray-300">A playful 2D math shooter where rockets hit falling math questions.</p>
          <label className="mb-2 text-lg">Choose your Operation</label>
          <select
            value={operation}
            onChange={(e) =>
              setOperation(e.target.value as "+" | "-" | "*" | "/" | "all")
            }
            className="mb-4 p-2 rounded bg-gray-800 text-white border border-gray-600"
          >
            <option value="all">All</option>
            <option value="+">Addition (+)</option>
            <option value="-">Subtraction (-)</option>
            <option value="*">Multiplication (*)</option>
            <option value="/">Division (/)</option>
          </select>
          <button
            onClick={() => setGameStarted(true)}
            className="p-3 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Game Over overlay */}
      {gameOver && (() => {
        const effectiveHighScore = score > highScores[operation] ? score : highScores[operation];
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-red-500 text-3xl font-bold">
            <div className="mb-4 text-orange-400">Score: {score}</div>
            <div className="mb-4 text-green-400">High Score: {effectiveHighScore}</div>
            Game Over
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                // Update high score if current score is higher
                if (score > highScores[operation]) {
                  setHighScores(prev => ({
                    ...prev,
                    [operation]: score
                  }));
                }
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
      `}</style>
    </div>
  );
}
