'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getBrickLayout } from '@/app/actions';
import type { Ball, Paddle, Brick, GameState, Particle, FloatingScore, PowerUp, PowerUpType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import GameUI from './GameUI';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

const PADDLE_SENSITIVITY = 1.5;
const INITIAL_LIVES = 3;
const BASE_BALL_SPEED = 7;
const POWER_UP_SPEED = 2;
const POWER_UP_CHANCE = 0.1;

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
  const [isMuted, setIsMuted] = useState(false);

  const [bricks, setBricks] = useState<Brick[]>([]);
  const [ball, setBall] = useState<Ball>({ x: 0, y: 0, radius: 0, vx: 0, vy: 0, speed: 0 });
  const [paddle, setPaddle] = useState<Paddle>({ x: 0, y: 0, width: 0, height: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  const paddleWidthRef = useRef(dimensions.width / 6);
  const ballSpeedRef = useRef(BASE_BALL_SPEED);
  const userInteractedRef = useRef(false);

  const [playBrickHit, setBrickHitEnabled] = useSound('/sounds/brick-hit.mp3', { volume: 0.5, isMuted });
  const [playPaddleHit, setPaddleHitEnabled] = useSound('/sounds/paddle-hit.mp3', { volume: 0.5, isMuted });
  const [playLoseLife, setLoseLifeEnabled] = useSound('/sounds/lose-life.mp3', { volume: 0.5, isMuted });
  const [playLevelComplete, setLevelCompleteEnabled] = useSound('/sounds/level-complete.mp3', { volume: 0.5, isMuted });


  useEffect(() => {
    const enabled = userInteractedRef.current;
    setBrickHitEnabled(enabled);
    setPaddleHitEnabled(enabled);
    setLoseLifeEnabled(enabled);
    setLevelCompleteEnabled(enabled);
  }, [userInteractedRef.current, setBrickHitEnabled, setPaddleHitEnabled, setLoseLifeEnabled, setLevelCompleteEnabled]);

  const resetBallAndPaddle = useCallback(() => {
    if (dimensions.width === 0) return;
    
    let baseWidth = dimensions.width;
    let baseHeight = dimensions.height;

    paddleWidthRef.current = baseWidth / 7;
    ballSpeedRef.current = Math.max(BASE_BALL_SPEED, baseWidth / 150);


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
        if (!userInteractedRef.current) {
          userInteractedRef.current = true;
        }
        setBall(prev => ({
            ...prev,
            isStuck: false,
            vy: -prev.speed,
            vx: (Math.random() - 0.5) * 2 * (prev.speed / 1.5),
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
            const { clientWidth, clientHeight } = containerRef.current;
            setDimensions({ width: clientWidth, height: clientHeight });
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
    
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
    }
    
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
            setGameState('PLAYING');
            launchBall();
        } else if (gameState === 'PLAYING') {
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
        setBall(b => {
            const magnitude = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            let finalVx = b.vx;
            let finalVy = b.vy;

            if (magnitude > 0 && magnitude !== b.speed) {
              finalVx = (b.vx / magnitude) * b.speed;
              finalVy = (b.vy / magnitude) * b.speed;
            }

            const newX = b.x + finalVx;
            const newY = b.y + finalVy;
            return { ...b, x: newX, y: newY, vx: finalVx, vy: finalVy };
        });
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
      if (x + radius > dimensions.width || x - radius < 0) {
        vx = -vx;
        if(x + radius > dimensions.width) x = dimensions.width - radius;
        if(x - radius < 0) x = radius;
      }
      if (y - radius < 0) {
        vy = -vy;
        if(y-radius < 0) y = radius;
      }

      // Bottom wall (lose life)
      if (y + radius > dimensions.height) {
        playLoseLife();
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
        playPaddleHit();
        if (paddle.isSticky) {
            isStuck = true;
            y = paddle.y - radius;
            vy = 0;
            vx = 0;
        } else {
            let collidePoint = x - (paddle.x + paddle.width / 2);
            let normalizedCollidePoint = collidePoint / (paddle.width / 2);
            let angle = normalizedCollidePoint * (Math.PI / 3); // Max bounce angle: 60 degrees
            
            let newVx = speed * Math.sin(angle);
            let newVy = -speed * Math.cos(angle);

            // Ensure the ball maintains its speed
            const magnitude = Math.sqrt(newVx * newVx + newVy * newVy);
            vx = (newVx / magnitude) * speed;
            vy = (newVy / magnitude) * speed;

            y = paddle.y - radius; // Prevent sticking inside paddle
        }
      }

      // Brick collision
      setBricks(prevBricks => {
        const newBricks = [...prevBricks];
        for (let i = 0; i < newBricks.length; i++) {
          const brick = newBricks[i];
          if (!isStuck && x + radius > brick.x && x - radius < brick.x + brick.width && y + radius > brick.y && y - radius < brick.y + brick.height) {
            
            playBrickHit();
            const prevBallX = x - vx;
            const prevBallY = y - vy;

            if (prevBallX + radius <= brick.x || prevBallX - radius >= brick.x + brick.width) {
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
            playLevelComplete();
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
  }, [gameState, dimensions, paddle, lives, resetBallAndPaddle, ball.isStuck, ball.vx, ball.vy, playBrickHit, playPaddleHit, playLoseLife, playLevelComplete]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw paddle
    const paddleColor = paddle.isFrozen ? 'hsl(var(--secondary))' : 'hsl(var(--accent))';
    ctx.fillStyle = paddleColor;
    if (paddle.isSticky) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'hsl(var(--primary))';
    }
    if (paddle.isFrozen) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'hsl(var(--secondary-foreground))';
    }
    const cornerRadius = 10;
    ctx.beginPath();
    ctx.moveTo(paddle.x + cornerRadius, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - cornerRadius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + cornerRadius);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - cornerRadius);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - cornerRadius, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + cornerRadius, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - cornerRadius);
    ctx.lineTo(paddle.x, paddle.y + cornerRadius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + cornerRadius, paddle.y);
    ctx.closePath();
    ctx.fill();

    // Add a 3D effect / highlight
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowBlur = 0;


    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.shadowColor = 'hsl(var(--primary))';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
    
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
  
  const toggleMute = () => {
    if (!userInteractedRef.current) {
        userInteractedRef.current = true;
    }
    setIsMuted(current => !current);
  }

  return (
    <div ref={containerRef} className="w-full h-full max-w-full max-h-full flex items-center justify-center">
        <div style={{width: dimensions.width, height: dimensions.height}} className="relative shadow-2xl bg-transparent">
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                className="absolute top-0 left-0 z-0 cursor-pointer"
            />
            <GameUI
                gameState={gameState}
                score={score}
                level={level}
                lives={lives}
                isMuted={isMuted}
                onStart={startGame}
                onNextLevel={advanceLevel}
                onRestart={restartGame}
                onToggleMute={toggleMute}
                scoreGlow={scoreGlow}
            />
        </div>
    </div>
  );
};

export default PhysikBreakGame;

    
    
    

