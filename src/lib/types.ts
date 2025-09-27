export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strength: number;
  initialStrength: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  isStuck?: boolean;
}

export interface Paddle {
  x: number;
  width: number;
  height: number;
  y: number;
  isSticky?: boolean;
  isFrozen?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export interface FloatingScore {
  x: number;
  y: number;
  value: number;
  alpha: number;
  vy: number;
}

export type PowerUpType = 'PADDLE_EXPAND' | 'STICKY_PADDLE' | 'FAST_BALL' | 'PADDLE_SHRINK' | 'PADDLE_FREEZE';

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  vy: number;
}


export type GameState = 'START_SCREEN' | 'PLAYING' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'LOADING';
