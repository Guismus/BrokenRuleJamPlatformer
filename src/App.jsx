import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { Game } from './game/game.js';
import { audio } from './game/audio.js';
import { LEVELS } from './game/levels.js';

function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  const [gameState, setGameState] = useState('START_MENU');
  const [energy, setEnergy] = useState(3);
  const [maxEnergy, setMaxEnergy] = useState(3);
  const [time, setTime] = useState('00:00.0');
  const [deathCount, setDeathCount] = useState(0);
  const [levelInfo, setLevelInfo] = useState({ levelNum: '1-1', hint: '' });
  const [levelClearData, setLevelClearData] = useState(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new Game(canvasRef.current, {
        onStateChange: (state, data) => {
          setGameState(state);
          if (state === 'LEVEL_COMPLETE' && data) {
            setLevelClearData(data);
          }
        },
        onEnergyChange: (current, max) => {
          setEnergy(current);
          setMaxEnergy(max);
        },
        onTimeUpdate: (timeString) => {
          setTime(timeString);
        },
        onDeathCountUpdate: (count) => {
          setDeathCount(count);
        },
        onLevelStart: (data) => {
          setLevelInfo({ levelNum: data.levelNum, hint: data.hint });
          setDeathCount(data.deathCount);
        }
      });
      gameRef.current.run();
      gameRef.current.showStartMenu();
    }
  }, []);

  const handleStartGame = () => {
    audio.init();
    gameRef.current?.startLevel(0);
  };

  const handleShowLevelSelect = () => {
    audio.init();
    gameRef.current?.showLevelSelect();
  };

  const handleLevelSelect = (idx) => {
    gameRef.current?.startLevel(idx);
  };

  const handleResume = () => {
    gameRef.current?.togglePause();
  };

  const handleRestart = () => {
    gameRef.current?.togglePause();
    gameRef.current?.loadLevel(gameRef.current.currentLevelIndex);
  };

  const handleQuitToMenu = () => {
    gameRef.current?.showStartMenu();
  };

  const handleNextStage = () => {
    if (levelClearData && !levelClearData.isFinalLevel) {
      gameRef.current?.startLevel(gameRef.current.currentLevelIndex + 1);
    } else {
      gameRef.current?.startLevel(0);
    }
  };

  const toggleSound = () => {
    const isMuted = audio.toggleMute();
    setMuted(isMuted);
  };

  // Render Energy Cells
  const renderEnergyCells = () => {
    const cells = [];
    for (let i = 0; i < maxEnergy; i++) {
      cells.push(
        <div key={i} className={`energy-cell ${i < energy ? 'active' : 'spent'}`}></div>
      );
    }
    return cells;
  };

  return (
    <div id="game-wrapper">
      {/* Game Canvas */}
      <canvas ref={canvasRef} id="game-canvas" width="900" height="600" />

      {/* HUD Overlay */}
      <div id="hud">
        <div className="hud-item" id="level-display-container">
          STAGE <span id="level-num">{levelInfo.levelNum}</span>
        </div>
        
        <div className="hud-item">
          WATER
          <div id="energy-display">
            {renderEnergyCells()}
          </div>
        </div>
        
        <div className="hud-item" style={{ gap: '15px' }}>
          <div>DEATHS:<span id="death-count">{deathCount}</span></div>
          <div>TIME:<span id="time-elapsed">{time}</span></div>
        </div>
      </div>

      {/* Quick Level Tutorial/Hint */}
      {gameState === 'PLAYING' && (
        <div id="level-hint">{levelInfo.hint}</div>
      )}

      {/* 1. Start Menu Overlay */}
      {gameState === 'START_MENU' && (
        <div id="start-menu" className="modal-overlay">
          <h1 className="glitch-title">SUPER RECOIL PLUMBER</h1>
          <div className="subtitle">FLUDD RECOIL SIMULATION</div>
          
          <div className="info-card">
            <h3>💥 THE BROKEN RULE</h3>
            <p>
              Your boots are stuck! You have <strong>no controls to walk</strong>, and <strong>no jump button</strong>.
              Ground friction holds you completely static.
            </p>
            <p>
              <strong>Move using your water pump recoil!</strong> Aim with your mouse and click to spray a high-pressure jet that launches you in the opposite direction.
            </p>
            
            <h3>🎮 CONTROLS</h3>
            <div className="controls-grid">
              <div><span className="key-cap">Mouse</span></div>
              <div>Aim water nozzle</div>
              <div><span className="key-cap">Left Click</span></div>
              <div>Spray water blast (costs 1 Water cell)</div>
              <div><span className="key-cap">R</span></div>
              <div>Instant manual restart (if stuck)</div>
              <div><span className="key-cap">ESC</span> / <span className="key-cap">P</span></div>
              <div>Pause game</div>
            </div>
          </div>

          <div className="btn-group">
            <button className="btn-cyber" onPointerUp={handleStartGame}>Start Game</button>
            <button className="btn-cyber magenta" onPointerUp={handleShowLevelSelect}>Select Stage</button>
          </div>
        </div>
      )}

      {/* 2. Level Select Overlay */}
      {gameState === 'LEVEL_SELECT' && (
        <div id="level-select-menu" className="modal-overlay">
          <h1 className="glitch-title">SELECT STAGE</h1>
          <div className="subtitle">Choose a simulation sector</div>

          <div className="level-grid" id="level-grid-container">
            {LEVELS.map((_, idx) => (
              <button 
                key={idx} 
                className="level-btn" 
                onPointerUp={() => handleLevelSelect(idx)}
              >
                1-{idx + 1}
              </button>
            ))}
          </div>

          <button className="btn-cyber magenta" onPointerUp={handleQuitToMenu}>Back to Menu</button>
        </div>
      )}

      {/* 3. Pause Menu Overlay */}
      {gameState === 'PAUSED' && (
        <div id="pause-menu" className="modal-overlay">
          <h1 className="glitch-title">PAUSED</h1>
          <div className="subtitle">Simulation suspended</div>
          
          <div className="btn-group">
            <button className="btn-cyber" onPointerUp={handleResume}>Resume</button>
            <button className="btn-cyber magenta" onPointerUp={handleRestart}>Restart</button>
            <button className="btn-cyber" style={{background:'#858585', borderColor:'#000'}} onPointerUp={handleQuitToMenu}>Quit</button>
          </div>
          <div className="pulse-text">Press ESC or P to Resume</div>
        </div>
      )}

      {/* 4. Game Over Overlay */}
      {gameState === 'GAME_OVER' && (
        <div id="game-over-menu" className="modal-overlay">
          <h1 className="glitch-title" style={{color: 'var(--mario-red)', textShadow: '4px 4px 0px #000'}}>TOO BAD!</h1>
          <div className="subtitle">Plumber restored</div>
          
          <div className="pulse-text">Respawning...</div>
        </div>
      )}

      {/* 5. Victory Screen Overlay */}
      {gameState === 'LEVEL_COMPLETE' && levelClearData && (
        <div id="victory-menu" className="modal-overlay">
          <h1 className="glitch-title">
            {levelClearData.isFinalLevel ? 'ALL STAGES CLEAR!' : `STAGE 1-${levelClearData.levelNum} CLEAR!`}
          </h1>
          <div className="subtitle" style={{color: levelClearData.isFinalLevel ? 'var(--luigi-green)' : 'var(--coin-gold)', textShadow: '3px 3px 0px #000'}}>
            {levelClearData.isFinalLevel ? 'YOU SAVED THE DAY!' : 'COURSE CLEAR!'}
          </div>

          <div className="info-card" style={{textAlign: 'center'}}>
            <h3>🏆 PLUMBER RECORDS</h3>
            <div className="victory-stats">
              <div className="stat-box">
                <div className="stat-label">Total Time</div>
                <div className="stat-value cyan" id="final-time">{levelClearData.timeString}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Fatalities</div>
                <div className="stat-value magenta" id="final-deaths">{levelClearData.deathCount}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Rank</div>
                <div className="stat-value green" id="final-rank">{levelClearData.rank}</div>
              </div>
            </div>
            <p>Walking is overrated. Water power is the future!</p>
          </div>

          <div className="btn-group">
            <button className="btn-cyber" onPointerUp={handleNextStage}>
              {levelClearData.isFinalLevel ? 'Replay Game' : 'Next Stage'}
            </button>
            <button className="btn-cyber magenta" onPointerUp={handleQuitToMenu}>Main Menu</button>
          </div>
        </div>
      )}

      {/* Sound Toggle */}
      <div id="sound-toggle" title="Toggle Sound FX" className={muted ? 'muted' : ''} onPointerUp={toggleSound}>
        {muted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        )}
      </div>
    </div>
  );
}

export default App;
