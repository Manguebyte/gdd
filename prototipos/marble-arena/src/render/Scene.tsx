// A cena 3D inteira. A ordem dos filhos importa: o GameLoop vem primeiro para
// a física andar antes de as bolinhas copiarem a posição no mesmo quadro.

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { GameManager } from '../game/GameManager';
import { useGame } from '../game/store';
import { AimArrow, AimSurface } from './AimArrow';
import { Arena } from './Arena';
import { CameraController } from './CameraController';
import { Marble } from './Marble';

function GameLoop({ game }: { game: GameManager }) {
  // dt limitado: se a aba ficou em segundo plano, não tenta recuperar segundos de física.
  useFrame((_, dt) => game.update(Math.min(dt, 0.1)));
  return null;
}

/** Reflexo nas bolinhas de vidro sem baixar HDR: um "estúdio" gerado pelo próprio Three.js. */
function ReflectionEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#fff1d6', '#7a5a3a', 0.9]} />
      <directionalLight
        color="#ffe0b0"
        intensity={2.4}
        position={[140, 220, 90]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-near={50}
        shadow-camera-far={600}
      />
    </>
  );
}

export function Scene({ game }: { game: GameManager }) {
  const ids = useGame((s) => s.marbleIds);
  return (
    <>
      <GameLoop game={game} />
      <color attach="background" args={['#bcdcec']} />
      <fog attach="fog" args={['#bcdcec', 700, 1500]} />
      <ReflectionEnvironment />
      <Lights />
      <Arena cfg={game.cfg} triangle={game.triangle} />
      <AimSurface game={game} />
      {ids.map((id) => (
        <Marble key={id} game={game} def={game.def(id)} />
      ))}
      <AimArrow game={game} />
      <CameraController game={game} />
    </>
  );
}
