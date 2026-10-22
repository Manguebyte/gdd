// Monta o jogo: espera o WebAssembly do Rapier, cria o GameManager e coloca
// o canvas 3D (React Three Fiber) com o HUD (React comum) por cima.

import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { GAME_CONFIG } from './config/gameConfig';
import { GameManager } from './game/GameManager';
import { gameStore } from './game/store';
import { bindKeyboard } from './input/keyboard';
import { initPhysics } from './physics/PhysicsManager';
import { Scene } from './render/Scene';
import { Hud } from './ui/Hud';

export function App() {
  const [game, setGame] = useState<GameManager | null>(null);

  useEffect(() => {
    let alive = true;
    initPhysics().then(() => {
      if (!alive) return;
      const g = new GameManager(GAME_CONFIG, gameStore);
      g.newRack();
      setGame(g);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => (game ? bindKeyboard(game, gameStore) : undefined), [game]);

  return (
    <>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, near: 1, far: 3000, position: [0, 200, 160] }}>
        {game && <Scene game={game} />}
      </Canvas>
      {game ? <Hud game={game} /> : <div className="loading">Carregando a física…</div>}
    </>
  );
}
