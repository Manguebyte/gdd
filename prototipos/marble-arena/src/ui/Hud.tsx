// Interface por cima do canvas (GDD §8). Só lê o store e chama o GameManager;
// não sabe nada de física nem de Three.js.

import { useEffect, useState } from 'react';
import type { GamePhase } from '../core/types';
import type { GameManager } from '../game/GameManager';
import { gameStore, useGame } from '../game/store';

const PHASE_LABEL: Record<GamePhase, string> = {
  MAIN_MENU: 'Menu',
  MATCH_SETUP: 'Preparando a partida',
  OPENING_ROUND: 'Rodada de abertura',
  MAIN_GAME: 'Partida',
  AIMING: 'Mirando',
  SHOT_IN_PROGRESS: 'Bolinhas rolando…',
  RESOLVING_TURN: 'Contando…',
  GAME_OVER: 'Triângulo limpo!',
};

function StatusPanel() {
  const phase = useGame((s) => s.phase);
  const shots = useGame((s) => s.shots);
  const captured = useGame((s) => s.captured);
  const remaining = useGame((s) => s.stakesRemaining);
  const total = useGame((s) => s.stakesTotal);
  return (
    <div className="panel status">
      <div className="title">
        Marble Arena <span className="tag">Marco 1 · treino</span>
      </div>
      <div className={`phase phase-${phase}`}>{PHASE_LABEL[phase]}</div>
      <div className="player">
        <span className="swatch" style={{ background: '#d62828' }} /> Jogador 1
      </div>
      <dl>
        <div>
          <dt>Capturadas</dt>
          <dd>{captured}</dd>
        </div>
        <div>
          <dt>No triângulo</dt>
          <dd>
            {remaining}/{total}
          </dd>
        </div>
        <div>
          <dt>Tiros</dt>
          <dd>{shots}</dd>
        </div>
      </dl>
      <p className="goal">Objetivo: tirar todas as casadas inteiras de dentro do triângulo.</p>
    </div>
  );
}

function AimPanel({ game }: { game: GameManager }) {
  const aim = useGame((s) => s.aim);
  const phase = useGame((s) => s.phase);
  const followCam = useGame((s) => s.followCam);
  const canShoot = phase === 'AIMING';
  const { setPower, setPitch, setLocked, toggleFollowCam } = gameStore.getState();
  const pct = Math.round(aim.power * 100);

  return (
    <div className={`panel aim ${canShoot ? '' : 'disabled'}`}>
      <div className="row">
        <span className="label">Direção</span>
        <span className="value">{aim.yawDeg.toFixed(1)}°</span>
        <button className={`chip ${aim.locked ? 'on' : ''}`} onClick={() => setLocked(!aim.locked)} disabled={!canShoot}>
          {aim.locked ? 'Travada' : 'Seguindo o mouse'}
        </button>
      </div>
      <div className="row">
        <span className="label">Força</span>
        <div className="meter">
          <div className="fill" style={{ width: `${pct}%`, background: `hsl(${120 * (1 - aim.power)}deg 80% 45%)` }} />
        </div>
        <span className="value">{pct}%</span>
      </div>
      <input type="range" min={0} max={100} value={pct} disabled={!canShoot} onChange={(e) => setPower(Number(e.target.value) / 100)} aria-label="Força" />
      <div className="row">
        <span className="label">Ângulo</span>
        <input
          type="range"
          min={0}
          max={game.cfg.shot.maxPitchDeg}
          step={0.5}
          value={aim.pitchDeg}
          disabled={!canShoot}
          onChange={(e) => setPitch(Number(e.target.value))}
          aria-label="Ângulo vertical"
        />
        <span className="value">{aim.pitchDeg.toFixed(1)}°</span>
      </div>
      <div className="row buttons">
        <button className="shoot" onClick={() => game.shoot()} disabled={!canShoot || aim.power <= 0}>
          {canShoot ? 'Atirar' : PHASE_LABEL[phase]}
        </button>
        <button className={`chip ${followCam ? 'on' : ''}`} onClick={toggleFollowCam}>
          Câmera segue
        </button>
      </div>
    </div>
  );
}

function Help() {
  const [open, setOpen] = useState(true);
  return (
    <div className="panel help">
      <button className="help-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Esconder controles' : 'Controles'}
      </button>
      {open && (
        <ul>
          <li><b>Mouse</b> no chão: aponta a direção</li>
          <li><b>Clique</b>: trava/destrava a direção</li>
          <li><b>A/D</b> ou ←/→: ajuste fino (Shift: mais fino)</li>
          <li><b>W/S</b> ou ↑/↓: força</li>
          <li><b>Q/E</b>: ângulo vertical</li>
          <li><b>Espaço</b>: atirar</li>
          <li><b>Botão direito</b> arrastando: girar câmera</li>
          <li><b>Roda</b>: zoom · <b>C</b>: visão geral · <b>F</b>: câmera segue</li>
        </ul>
      )}
    </div>
  );
}

function ToastView() {
  const toast = useGame((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div key={toast.id} className={`toast ${visible ? 'show' : ''}`}>
      {toast.text}
    </div>
  );
}

function ClearedOverlay({ game }: { game: GameManager }) {
  const phase = useGame((s) => s.phase);
  const shots = useGame((s) => s.shots);
  const captured = useGame((s) => s.captured);
  if (phase !== 'GAME_OVER') return null;
  return (
    <div className="overlay">
      <div className="card">
        <h2>Triângulo limpo!</h2>
        <p>
          {captured} casadas capturadas em {shots} {shots === 1 ? 'tiro' : 'tiros'}.
        </p>
        <button className="shoot" onClick={() => game.newRack()}>
          Arrumar de novo
        </button>
      </div>
    </div>
  );
}

export function Hud({ game }: { game: GameManager }) {
  return (
    <div className="hud">
      <StatusPanel />
      <Help />
      <AimPanel game={game} />
      <button className="panel reset" onClick={() => game.newRack()}>
        Recomeçar
      </button>
      <ToastView />
      <ClearedOverlay game={game} />
    </div>
  );
}
