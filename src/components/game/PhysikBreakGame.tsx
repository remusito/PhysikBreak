'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getBrickLayout } from '@/app/actions';
import type { Ball, Paddle, Brick, GameState, Particle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import GameUI from './GameUI';

const PADDLE_SENSITIVITY = 1.5;
const INITIAL_LIVES = 3;
const BALL_SPEED = 5;

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

  const [bricks, setBricks] = useState<Brick[]>([]);
  const [ball, setBall] = useState<Ball>({ x: 0, y: 0, radius: 0, vx: 0, vy: 0, speed: 0 });
  const [paddle, setPaddle] = useState<Paddle>({ x: 0, y: 0, width: 0, height: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);

  const resetBallAndPaddle = useCallback(() => {
    if (dimensions.width === 0) return;
    const newPaddle = {
      width: dimensions.width / 5,
      height: 20,
      x: (dimensions.width - dimensions.width / 5) / 2,
      y: dimensions.height - 30,
    };
    setPaddle(newPaddle);
    setBall({
      radius: 10,
      x: dimensions.width / 2,
      y: newPaddle.y - 20,
      speed: Math.min(BALL_SPEED, dimensions.width / 100),
      vx: 0,
      vy: 0,
    });
  }, [dimensions]);
  
  const launchBall = () => {
    setBall(prev => ({
        ...prev,
        vx: (Math.random() - 0.5) * 2,
        vy: -prev.speed
    }));
  }

  const loadLevel = useCallback(async (currentLevel: number) => {
    if (dimensions.width === 0) return;
    setGameState('LOADING');
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
    if (gameState !== 'PLAYING' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPaddleX = clientX - rect.left - paddle.width / 2;
    setPaddle(p => ({
      ...p,
      x: Math.max(0, Math.min(newPaddleX, dimensions.width - p.width)),
    }));
  };

  useEffect(() => {
    const moveHandler = (e: MouseEvent) => handleInteraction(e.clientX);
    const touchHandler = (e: TouchEvent) => handleInteraction(e.touches[0].clientX);
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('touchmove', touchHandler);
    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('touchmove', touchHandler);
    };
  }, [gameState, paddle.width, dimensions.width]);
  
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

  const gameLoop = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // Ball movement
    setBall(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }));

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

    setBall(b => {
      let { x, y, vx, vy, radius, speed } = b;

      // Wall collision
      if (x + radius > dimensions.width || x - radius < 0) vx = -vx;
      if (y - radius < 0) vy = -vy;

      // Bottom wall (lose life)
      if (y + radius > dimensions.height) {
        setLives(l => l - 1);
        if (lives - 1 <= 0) {
          setGameState('GAME_OVER');
        } else {
          resetBallAndPaddle();
          setGameState('START_SCREEN');
        }
        return { ...b, x, y, vx, vy };
      }

      // Paddle collision
      if (y + radius > paddle.y && y - radius < paddle.y + paddle.height && x > paddle.x && x < paddle.x + paddle.width) {
        let collidePoint = x - (paddle.x + paddle.width / 2);
        collidePoint = collidePoint / (paddle.width / 2);
        let angle = collidePoint * (Math.PI / 3);
        vx = speed * Math.sin(angle);
        vy = -speed * Math.cos(angle);
        y = paddle.y - radius;
      }

      // Brick collision
      setBricks(prevBricks => {
        const newBricks = [...prevBricks];
        for (let i = 0; i < newBricks.length; i++) {
          const brick = newBricks[i];
          if (x > brick.x && x < brick.x + brick.width && y > brick.y && y < brick.y + brick.height) {
            vy = -vy;
            brick.strength -= 1;
            setScore(s => s + 10);
            
            if (brick.strength <= 0) {
              createExplosion(brick);
              newBricks.splice(i, 1);
              setScore(s => s + 50);
            }
            break;
          }
        }
        if (newBricks.length === 0) {
            setGameState('LEVEL_COMPLETE');
            setScore(s => s + 1000);
        }
        return newBricks;
      });

      return { ...b, x, y, vx, vy };
    });

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameState, dimensions, paddle, lives, resetBallAndPaddle]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw paddle
    ctx.fillStyle = 'hsl(var(--accent))';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

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


  }, [ball, paddle, bricks, particles, dimensions]);

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
      launchBall();
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
                className="absolute top-0 left-0"
                onClick={gameState === 'START_SCREEN' ? startGame : undefined}
            />
            <GameUI
                gameState={gameState}
                score={score}
                level={level}
                lives={lives}
                onStart={startGame}
                onNextLevel={advanceLevel}
                onRestart={restartGame}
            />
        </div>
    </div>
  );
};

export default PhysikBreakGame;
