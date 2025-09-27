'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getBrickLayout } from '@/app/actions';
import type { Ball, Paddle, Brick, GameState, Particle, FloatingScore, PowerUp, PowerUpType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import GameUI from './GameUI';

const PADDLE_SENSITIVITY = 1.5;
const INITIAL_LIVES = 3;
const BALL_SPEED = 5;
const POWER_UP_SPEED = 2;
const POWER_UP_CHANCE = 0.2; // 20% chance

const PhysikBreakGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const { toast } = useToast();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState<GameState>('LOADING');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [scoreGlow, setScoreGlow] = useState(false);

  const [bricks, setBricks] = useState<Brick[]>([]);
  const [ball, setBall] = useState<Ball>({ x: 0, y: 0, radius: 0, vx: 0, vy: 0, speed: 0 });
  const [paddle, setPaddle] = useState<Paddle>({ x: 0, y: 0, width: 0, height: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  const paddleWidthRef = useRef(dimensions.width / 5);

  const resetBallAndPaddle = useCallback(() => {
    if (dimensions.width === 0) return;
    paddleWidthRef.current = dimensions.width / 5;
    const newPaddle = {
      width: paddleWidthRef.current,
      height: 20,
      x: (dimensions.width - paddleWidthRef.current) / 2,
      y: dimensions.height - 30,
      isSticky: false,
    };
    setPaddle(newPaddle);
    setBall({
      radius: 10,
      x: dimensions.width / 2,
      y: newPaddle.y - 20,
      speed: Math.min(BALL_SPEED, dimensions.width / 100),
      vx: 0,
      vy: 0,
      isStuck: true,
    });
  }, [dimensions]);
  
  const launchBall = () => {
    if (ball.isStuck) {
        setBall(prev => ({
            ...prev,
            isStuck: false,
            vx: (Math.random() - 0.5) * 2,
            vy: -prev.speed
        }));
    }
  }

  const loadLevel = useCallback(async (currentLevel: number) => {
    if (dimensions.width === 0) return;
    setGameState('LOADING');
    setPowerUps([]);
    try {
      const layout = await getBrickLayout(currentLevel, dimensions.width, dimensions.height);
      const newBricks = layout.bricks.map(b => ({...b, initialStrength: b.strength}));
      setBricks(newBricks);
      resetBallAndPaddle();
      setGameState('START_SCREEN');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading level',
        description: 'Could not generate brick layout. Please try again.',
      });
      setGameState('GAME_OVER');
    }
  }, [dimensions, resetBallAndPaddle, toast]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const aspectRatio = 16 / 9;
        const newWidth = Math.min(width, height * aspectRatio);
        const newHeight = Math.min(height, width / aspectRatio);
        setDimensions({ width: newWidth, height: newHeight });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadLevel(level);
  }, [level, dimensions.width]);

  const handleInteraction = (clientX: number) => {
    if (gameState !== 'PLAYING' && gameState !== 'START_SCREEN' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPaddleX = clientX - rect.left - paddle.width / 2;
    setPaddle(p => ({
      ...p,
      x: Math.max(0, Math.min(newPaddleX, dimensions.width - p.width)),
    }));

    if (ball.isStuck) {
        setBall(b => ({ ...b, x: clientX - rect.left }));
    }
  };

  useEffect(() => {
    const moveHandler = (e: MouseEvent) => handleInteraction(e.clientX);
    const touchHandler = (e: TouchEvent) => handleInteraction(e.touches[0].clientX);
    const clickHandler = () => {
        if(gameState === 'START_SCREEN') {
            startGame();
        } else {
            launchBall();
        }
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('touchmove', touchHandler);
    containerRef.current?.addEventListener('click', clickHandler);
    
    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('touchmove', touchHandler);
      containerRef.current?.removeEventListener('click', clickHandler);
    };
  }, [gameState, paddle.width, dimensions.width, ball.isStuck]);
  
  const createExplosion = (brick: Brick) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
        radius: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        alpha: 1,
        color: brick.color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const addFloatingScore = (value: number, x: number, y: number) => {
    setFloatingScores(prev => [...prev, { x, y, value, alpha: 1, vy: -1 }]);
  };

  const triggerScoreGlow = () => {
    setScoreGlow(true);
    setTimeout(() => setScoreGlow(false), 300);
  }

  const activatePowerUp = (type: PowerUpType) => {
    if (type === 'PADDLE_EXPAND') {
        paddleWidthRef.current *= 1.5;
        setPaddle(p => ({...p, width: paddleWidthRef.current}));
        setTimeout(() => {
            paddleWidthRef.current /= 1.5;
            setPaddle(p => ({...p, width: paddleWidthRef.current}));
        }, 10000);
    } else if (type === 'STICKY_PADDLE') {
        setPaddle(p => ({...p, isSticky: true}));
        setTimeout(() => {
            setPaddle(p => ({...p, isSticky: false}));
        }, 15000)
    }
  }

  const createPowerUp = (x: number, y: number) => {
    if (Math.random() > POWER_UP_CHANCE) return;
    
    const powerUpTypes: PowerUpType[] = ['PADDLE_EXPAND', 'STICKY_PADDLE'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    setPowerUps(prev => [...prev, {
        x,
        y,
        width: 30,
        height: 15,
        type,
        vy: POWER_UP_SPEED,
    }]);
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // Ball movement
    if (!ball.isStuck) {
        setBall(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }));
    }

    setParticles(particles =>
      particles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          alpha: p.alpha - 0.02,
        }))
        .filter(p => p.alpha > 0)
    );

    setFloatingScores(scores => 
        scores.map(fs => ({
            ...fs,
            y: fs.y + fs.vy,
            alpha: fs.alpha - 0.02
        })).filter(fs => fs.alpha > 0)
    );

    setPowerUps(prev => prev.map(p => ({...p, y: p.y + p.vy})).filter(p => p.y < dimensions.height));

    setBall(b => {
      let { x, y, vx, vy, radius, speed, isStuck } = b;

      // Wall collision
      if (x + radius > dimensions.width || x - radius < 0) vx = -vx;
      if (y - radius < 0) vy = -vy;

      // Bottom wall (lose life)
      if (y + radius > dimensions.height) {
        setLives(l => l - 1);
        setPowerUps([]);
        if (lives - 1 <= 0) {
          setGameState('GAME_OVER');
        } else {
          resetBallAndPaddle();
          setGameState('START_SCREEN');
        }
        return { ...b, x, y, vx, vy, isStuck };
      }

      // Paddle collision
      if (y + radius > paddle.y && y - radius < paddle.y + paddle.height && x > paddle.x && x < paddle.x + paddle.width) {
        if (paddle.isSticky) {
            isStuck = true;
            y = paddle.y - radius;
            vy = 0;
            vx = 0;
        } else {
            let collidePoint = x - (paddle.x + paddle.width / 2);
            collidePoint = collidePoint / (paddle.width / 2);
            let angle = collidePoint * (Math.PI / 3);
            vx = speed * Math.sin(angle);
            vy = -speed * Math.cos(angle);
            y = paddle.y - radius;
        }
      }

      // Brick collision
      setBricks(prevBricks => {
        const newBricks = [...prevBricks];
        for (let i = 0; i < newBricks.length; i++) {
          const brick = newBricks[i];
          if (!isStuck && x > brick.x && x < brick.x + brick.width && y > brick.y && y < brick.y + brick.height) {
            vy = -vy;
            brick.strength -= 1;
            const points = 10;
            setScore(s => s + points);
            addFloatingScore(points, brick.x + brick.width / 2, brick.y + brick.height / 2);
            triggerScoreGlow();
            
            if (brick.strength <= 0) {
              createExplosion(brick);
              createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
              newBricks.splice(i, 1);
              const bonusPoints = 50;
              setScore(s => s + bonusPoints);
              addFloatingScore(bonusPoints, brick.x + brick.width / 2, brick.y - 10);
            }
            break;
          }
        }
        if (newBricks.length === 0) {
            setGameState('LEVEL_COMPLETE');
            setScore(s => s + 1000);
            setPowerUps([]);
        }
        return newBricks;
      });

      // Power-up collision
      setPowerUps(prevPowerUps => {
        const remainingPowerups = [...prevPowerUps];
        for(let i = remainingPowerups.length - 1; i >= 0; i--) {
            const powerUp = remainingPowerups[i];
            if (
                powerUp.x < paddle.x + paddle.width &&
                powerUp.x + powerUp.width > paddle.x &&
                powerUp.y < paddle.y + paddle.height &&
                powerUp.y + powerUp.height > paddle.y
            ) {
                activatePowerUp(powerUp.type);
                remainingPowerups.splice(i, 1);
            }
        }
        return remainingPowerups;
      });


      return { ...b, x, y, vx, vy, isStuck };
    });

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameState, dimensions, paddle, lives, resetBallAndPaddle, ball.isStuck]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw paddle
    ctx.fillStyle = 'hsl(var(--accent))';
    if (paddle.isSticky) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'hsl(var(--primary))';
    }
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;


    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.fill();
    ctx.closePath();
    
    // Draw bricks
    bricks.forEach(brick => {
      ctx.fillStyle = brick.color;
      ctx.globalAlpha = brick.strength / brick.initialStrength;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.globalAlpha = 1.0;
    });

    // Draw particles
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.closePath();
    });
    ctx.globalAlpha = 1.0;

    // Draw floating scores
    floatingScores.forEach(fs => {
        ctx.globalAlpha = fs.alpha;
        ctx.fillStyle = 'hsl(var(--primary-foreground))';
        ctx.font = 'bold 20px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText(fs.value.toString(), fs.x, fs.y);
    });
    ctx.globalAlpha = 1.0;

    // Draw power-ups
    powerUps.forEach(p => {
        ctx.fillStyle = 'hsl(var(--primary))';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = 'hsl(var(--primary-foreground))';
        ctx.font = 'bold 12px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const powerUpText = p.type === 'PADDLE_EXPAND' ? 'E' : 'S';
        ctx.fillText(powerUpText, p.x + p.width / 2, p.y + p.height / 2);
    });

  }, [ball, paddle, bricks, particles, floatingScores, powerUps, dimensions]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const renderLoop = () => {
        draw();
        requestAnimationFrame(renderLoop);
    };
    const renderId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(renderId);
  }, [draw])

  const startGame = () => {
    if (gameState === 'START_SCREEN' || gameState === 'LEVEL_COMPLETE') {
      if(ball.isStuck) launchBall();
      setGameState('PLAYING');
    }
  };

  const advanceLevel = () => {
    setLevel(l => l + 1);
  };

  const restartGame = () => {
    setScore(0);
    setLevel(1);
    setLives(INITIAL_LIVES);
    loadLevel(1);
  };
  
  return (
    <div ref={containerRef} className="w-full h-full max-w-full max-h-full flex items-center justify-center">
        <div style={{width: dimensions.width, height: dimensions.height}} className="relative bg-transparent shadow-2xl">
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                className="absolute top-0 left-0 cursor-pointer"
            />
            <GameUI
                gameState={gameState}
                score={score}
                level={level}
                lives={lives}
                onStart={startGame}
                onNextLevel={advanceLevel}
                onRestart={restartGame}
                scoreGlow={scoreGlow}
            />
        </div>
    </div>
  );
};

export default PhysikBreakGame;
