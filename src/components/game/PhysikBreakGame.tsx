'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getBrickLayout } from '@/app/actions';
import type { Ball, Paddle, Brick, GameState, Particle, FloatingScore, PowerUp, PowerUpType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import GameUI from './GameUI';
import { cn } from '@/lib/utils';

const PADDLE_SENSITIVITY = 1.5;
const INITIAL_LIVES = 3;
const BASE_BALL_SPEED = 5;
const POWER_UP_SPEED = 2;
const POWER_UP_CHANCE = 0.3; // 30% chance

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

  const paddleWidthRef = useRef(dimensions.width / 6);
  const ballSpeedRef = useRef(BASE_BALL_SPEED);

  const resetBallAndPaddle = useCallback(() => {
    if (dimensions.width === 0) return;
    
    let baseWidth = dimensions.width;
    let baseHeight = dimensions.height;

    paddleWidthRef.current = baseWidth / 6;
    ballSpeedRef.current = Math.min(BASE_BALL_SPEED, baseWidth / 150);

    const newPaddle = {
      width: paddleWidthRef.current,
      height: 20,
      x: (baseWidth - paddleWidthRef.current) / 2,
      y: baseHeight - 120, // Move paddle up
      isSticky: false,
      isFrozen: false,
    };
    setPaddle(newPaddle);
    setBall({
      radius: 10,
      x: baseWidth / 2,
      y: newPaddle.y - 20,
      speed: ballSpeedRef.current,
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
            vx: (Math.random() - 0.5) * 2 * prev.speed,
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
        setDimensions({ width, height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if(dimensions.width > 0){
      loadLevel(level);
    }
  }, [level, dimensions.width, loadLevel]);

  const handleInteraction = (clientX: number) => {
    if (gameState !== 'PLAYING' && gameState !== 'START_SCREEN' || !containerRef.current || paddle.isFrozen) return;
    
    // Adjust for the game canvas's position within the container
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasRect = canvasRef.current!.getBoundingClientRect();
    const offsetX = (containerRect.width - canvasRect.width) / 2;

    const relativeX = clientX - containerRect.left - offsetX;

    const newPaddleX = relativeX - paddle.width / 2;
    setPaddle(p => ({
      ...p,
      x: Math.max(0, Math.min(newPaddleX, dimensions.width - p.width)),
    }));

    if (ball.isStuck) {
        setBall(b => ({ ...b, x: relativeX }));
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

    const currentRef = containerRef.current;
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('touchmove', touchHandler);
    currentRef?.addEventListener('click', clickHandler);
    
    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('touchmove', touchHandler);
      currentRef?.removeEventListener('click', clickHandler);
    };
  }, [gameState, paddle.width, dimensions.width, ball.isStuck, paddle.isFrozen]);
  
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
        paddleWidthRef.current = Math.min(paddleWidthRef.current * 1.5, dimensions.width * 0.8);
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
    } else if (type === 'FAST_BALL') {
        ballSpeedRef.current *= 1.5;
        setBall(b => ({...b, speed: ballSpeedRef.current}));
        setTimeout(() => {
            ballSpeedRef.current /= 1.5;
            setBall(b => ({...b, speed: ballSpeedRef.current}));
        }, 10000);
    } else if (type === 'PADDLE_SHRINK') {
        paddleWidthRef.current *= 0.5;
        setPaddle(p => ({...p, width: paddleWidthRef.current}));
        setTimeout(() => {
            paddleWidthRef.current /= 0.5;
            setPaddle(p => ({...p, width: paddleWidthRef.current}));
        }, 10000);
    } else if (type === 'PADDLE_FREEZE') {
        setPaddle(p => ({...p, isFrozen: true}));
        setTimeout(() => {
            setPaddle(p => ({...p, isFrozen: false}));
        }, 3000)
    }
  }

  const createPowerUp = (x: number, y: number) => {
    if (Math.random() > POWER_UP_CHANCE) return;
    
    const powerUpTypes: PowerUpType[] = ['PADDLE_EXPAND', 'STICKY_PADDLE', 'FAST_BALL', 'PADDLE_SHRINK', 'PADDLE_FREEZE'];
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
        const currentSpeed = ballSpeedRef.current;
        const currentVelocityMagnitude = Math.sqrt(ball.vx**2 + ball.vy**2);
        
        let newVx = ball.vx;
        let newVy = ball.vy;

        // Normalize and apply current speed, preserving direction
        if (currentVelocityMagnitude > 0 && currentVelocityMagnitude !== currentSpeed) {
            const factor = currentSpeed / currentVelocityMagnitude;
            newVx *= factor;
            newVy *= factor;
        }
        setBall(b => ({ ...b, x: b.x + newVx, y: b.y + newVy, vx: newVx, vy: newVy }));
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
      let { x, y, vx, vy, radius, isStuck } = b;
      let speed = ballSpeedRef.current;

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
          if (!isStuck && x + radius > brick.x && x - radius < brick.x + brick.width && y + radius > brick.y && y - radius < brick.y + brick.height) {
            
            // simple collision detection, checking which side we hit
            const overlapX = (x < brick.x + brick.width / 2) ? (x + radius - brick.x) : (brick.x + brick.width - (x - radius));
            const overlapY = (y < brick.y + brick.height / 2) ? (y + radius - brick.y) : (brick.y + brick.height - (y - radius));

            if (overlapX < overlapY) {
                vx = -vx;
            } else {
                vy = -vy;
            }
            
            brick.strength -= 1;
            const points = 10;
            setScore(s => s + points);
            addFloatingScore(points, brick.x + brick.width / 2, brick.y + brick.height / 2);
            triggerScoreGlow();
            
            if (brick.strength <= 0) {
              createExplosion(brick);
              createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
              newBricks.splice(i, 1);
              const bonusPoints = 50 * brick.initialStrength;
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
  }, [gameState, dimensions, paddle, lives, resetBallAndPaddle, ball.isStuck, ball.vx, ball.vy]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw paddle
    ctx.fillStyle = paddle.isFrozen ? 'hsl(var(--secondary))' : 'hsl(var(--accent))';
    if (paddle.isSticky) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'hsl(var(--primary))';
    }
    if (paddle.isFrozen) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'hsl(var(--secondary-foreground))';
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
      ctx.globalAlpha = Math.max(0.2, brick.strength / brick.initialStrength);
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      
      if (brick.strength > 1) {
          ctx.fillStyle = "white";
          ctx.font = 'bold 12px "Space Grotesk"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(brick.strength.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2);
      }
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
        const isPowerDown = p.type === 'PADDLE_SHRINK' || p.type === 'PADDLE_FREEZE';
        const centerX = p.x + p.width / 2;
        const centerY = p.y + p.height / 2;

        ctx.fillStyle = isPowerDown ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
        ctx.beginPath();
        ctx.arc(centerX, centerY, p.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isPowerDown ? 'hsl(var(--destructive-foreground))' : 'hsl(var(--primary-foreground))';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        switch(p.type) {
            case 'PADDLE_EXPAND':
                ctx.moveTo(centerX - 5, centerY);
                ctx.lineTo(centerX + 5, centerY);
                ctx.moveTo(centerX - 5, centerY);
                ctx.lineTo(centerX - 8, centerY - 3);
                ctx.moveTo(centerX - 5, centerY);
                ctx.lineTo(centerX - 8, centerY + 3);
                ctx.moveTo(centerX + 5, centerY);
                ctx.lineTo(centerX + 8, centerY - 3);
                ctx.moveTo(centerX + 5, centerY);
                ctx.lineTo(centerX + 8, centerY + 3);
                break;
            case 'STICKY_PADDLE':
                ctx.beginPath();
                ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'hsl(var(--primary-foreground))';
                ctx.fill();
                break;
            case 'FAST_BALL':
                ctx.moveTo(centerX, centerY - 5);
                ctx.lineTo(centerX, centerY + 5);
                ctx.lineTo(centerX - 4, centerY + 1);
                ctx.moveTo(centerX, centerY - 5);
                ctx.lineTo(centerX + 4, centerY + 1);
                break;
            case 'PADDLE_SHRINK':
                ctx.moveTo(centerX - 5, centerY);
                ctx.lineTo(centerX + 5, centerY);
                ctx.moveTo(centerX - 5, centerY);
                ctx.lineTo(centerX - 2, centerY - 3);
                ctx.moveTo(centerX - 5, centerY);
                ctx.lineTo(centerX - 2, centerY + 3);
                ctx.moveTo(centerX + 5, centerY);
                ctx.lineTo(centerX + 2, centerY - 3);
                ctx.moveTo(centerX + 5, centerY);
                ctx.lineTo(centerX + 2, centerY + 3);
                break;
            case 'PADDLE_FREEZE': // Snowflake
                 for (let i = 0; i < 6; i++) {
                    const angle = (i * 60) * Math.PI / 180;
                    const x1 = centerX + Math.cos(angle) * 3;
                    const y1 = centerY + Math.sin(angle) * 3;
                    const x2 = centerX + Math.cos(angle) * 7;
                    const y2 = centerY + Math.sin(angle) * 7;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                break;
        }
        ctx.stroke();
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
        <div style={{width: dimensions.width, height: dimensions.height}} className="relative shadow-2xl bg-transparent">
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
