"use client";

import {
  BarChart3,
  ChevronDown,
  RotateCcw,
  Settings,
  Shuffle,
  Star,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BitcoinIcon } from "./BitcoinIcon";

type Mode = "manual" | "auto";
type Direction = "over" | "under";
type BetResult = {
  id: number;
  roll: number;
  win: boolean;
};

const HOUSE_EDGE = 0.99;
const MIN_CHANCE = 2;
const MAX_CHANCE = 98;
const initialBalance = 0.1233432;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatBtc(value: number, digits = 8) {
  return value.toFixed(digits);
}

export function DiceGame() {
  const [mode, setMode] = useState<Mode>("manual");
  const [direction, setDirection] = useState<Direction>("over");
  const [betAmount, setBetAmount] = useState(0.00001);
  const [winChance, setWinChance] = useState(44);
  const [balance, setBalance] = useState(initialBalance);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [history, setHistory] = useState<BetResult[]>([
    { id: 1, roll: 78, win: true },
    { id: 2, roll: 15, win: false },
    { id: 3, roll: 21, win: false },
    { id: 4, roll: 66, win: true },
  ]);
  const [autoRunning, setAutoRunning] = useState(false);
  const [numberOfBets, setNumberOfBets] = useState(10);
  const [betsRemaining, setBetsRemaining] = useState(10);
  const [stopProfit, setStopProfit] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [onWinIncrease, setOnWinIncrease] = useState(0);
  const [onLossIncrease, setOnLossIncrease] = useState(0);
  const [sessionProfit, setSessionProfit] = useState(0);
  const baseBetRef = useRef(betAmount);

  const rollTarget = useMemo(() => {
    return direction === "over" ? round(100 - winChance, 2) : round(winChance, 2);
  }, [direction, winChance]);

  const multiplier = useMemo(() => round(HOUSE_EDGE / (winChance / 100), 4), [winChance]);
  const profitOnWin = useMemo(() => betAmount * (multiplier - 1), [betAmount, multiplier]);
  const sliderValue = direction === "over" ? 100 - winChance : winChance;
  const winGradient =
    direction === "over"
      ? `linear-gradient(90deg, #ff174f 0%, #ff174f ${sliderValue}%, #00e701 ${sliderValue}%, #00e701 100%)`
      : `linear-gradient(90deg, #00e701 0%, #00e701 ${sliderValue}%, #ff174f ${sliderValue}%, #ff174f 100%)`;

  function syncFromChance(nextChance: number) {
    setWinChance(clamp(round(nextChance, 2), MIN_CHANCE, MAX_CHANCE));
  }

  function syncFromMultiplier(nextMultiplier: number) {
    if (!Number.isFinite(nextMultiplier) || nextMultiplier <= 0) return;
    syncFromChance((HOUSE_EDGE / nextMultiplier) * 100);
  }

  function syncFromRoll(nextRoll: number) {
    if (!Number.isFinite(nextRoll)) return;
    const target = clamp(nextRoll, 2, 98);
    syncFromChance(direction === "over" ? 100 - target : target);
  }

  function setBetSafely(nextBet: number) {
    setBetAmount(clamp(nextBet, 0.00000001, Math.max(balance, 0.00000001)));
  }

  const placeBet = useCallback((source: "manual" | "auto" = "manual") => {
    const wager = clamp(betAmount, 0.00000001, balance);
    if (wager <= 0 || balance <= 0) {
      setAutoRunning(false);
      return;
    }

    const rollValue = round(Math.random() * 100, 2);
    const didWin = direction === "over" ? rollValue > rollTarget : rollValue < rollTarget;
    const delta = didWin ? wager * (multiplier - 1) : -wager;

    setBalance((current) => Math.max(0, current + delta));
    setLastRoll(rollValue);
    setSessionProfit((current) => current + delta);
    setHistory((current) => [
      { id: Date.now(), roll: rollValue, win: didWin },
      ...current.slice(0, 9),
    ]);

    if (source === "auto") {
      if (didWin) {
        setBetAmount((current) =>
          onWinIncrease > 0 ? clamp(current * (1 + onWinIncrease / 100), 0.00000001, balance) : baseBetRef.current,
        );
      } else {
        setBetAmount((current) =>
          onLossIncrease > 0 ? clamp(current * (1 + onLossIncrease / 100), 0.00000001, balance) : baseBetRef.current,
        );
      }
    }
  }, [balance, betAmount, direction, multiplier, onLossIncrease, onWinIncrease, rollTarget]);

  function toggleDirection() {
    setDirection((current) => (current === "over" ? "under" : "over"));
  }

  function startAuto() {
    if (autoRunning) {
      setAutoRunning(false);
      return;
    }
    baseBetRef.current = betAmount;
    setSessionProfit(0);
    setBetsRemaining(numberOfBets);
    setAutoRunning(true);
  }

  useEffect(() => {
    if (!autoRunning) return;
    if (betsRemaining <= 0) {
      setAutoRunning(false);
      return;
    }
    if ((stopProfit > 0 && sessionProfit >= stopProfit) || (stopLoss > 0 && sessionProfit <= -stopLoss)) {
      setAutoRunning(false);
      return;
    }

    const timer = window.setTimeout(() => {
      placeBet("auto");
      setBetsRemaining((current) => current - 1);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [autoRunning, betsRemaining, placeBet, sessionProfit, stopProfit, stopLoss]);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandMark">S</div>
        <div className="walletBox">
          <span>{formatBtc(balance, 8)}</span>
          <BitcoinIcon size={14} className="coinIcon" />
          <ChevronDown size={16} />
          <button type="button">
            <Wallet size={16} />
            Wallet
          </button>
        </div>
      </header>

      <section className="gameFrame">
        <aside className="betPanel">
          <div className="modeSwitch" aria-label="Bet mode">
            <button className={mode === "manual" ? "active" : ""} type="button" onClick={() => setMode("manual")}>
              Manual
            </button>
            <button className={mode === "auto" ? "active" : ""} type="button" onClick={() => setMode("auto")}>
              Auto
            </button>
            <button className="iconButton" type="button" aria-label="Switch roll direction" onClick={toggleDirection}>
              <Shuffle size={15} />
            </button>
          </div>

          <label className="fieldLabel">
            <span>Bet Amount</span>
            <span>${(betAmount * 98000).toFixed(2)}</span>
          </label>
          <div className="inputSplit">
            <div className="inputWithCoin">
              <input
                aria-label="Bet amount"
                inputMode="decimal"
                type="number"
                min="0.00000001"
                step="0.00000001"
                value={formatBtc(betAmount, 8)}
                onChange={(event) => setBetSafely(Number(event.target.value))}
              />
              <BitcoinIcon size={15} className="coinIcon" />
            </div>
            <button type="button" onClick={() => setBetSafely(betAmount / 2)}>
              1/2
            </button>
            <button type="button" onClick={() => setBetSafely(betAmount * 2)}>
              <span className="multiplierText">
                <span>2</span>
                <span>x</span>
              </span>
            </button>
          </div>

          <label className="fieldLabel">
            <span>Profit on Win</span>
            <span>${(profitOnWin * 98000).toFixed(2)}</span>
          </label>
          <div className="inputWithCoin solo">
            <input aria-label="Profit on win" readOnly value={formatBtc(profitOnWin, 8)} />
            <BitcoinIcon size={15} className="coinIcon" />
          </div>

          {mode === "auto" ? (
            <div className="autoGrid">
              <CompactInput label="Number of Bets" value={numberOfBets} min={1} onChange={setNumberOfBets} />
              <CompactInput label="On Win Increase" value={onWinIncrease} min={0} suffix="%" onChange={setOnWinIncrease} />
              <CompactInput label="On Loss Increase" value={onLossIncrease} min={0} suffix="%" onChange={setOnLossIncrease} />
              <CompactInput label="Stop on Profit" value={stopProfit} min={0} onChange={setStopProfit} />
              <CompactInput label="Stop on Loss" value={stopLoss} min={0} onChange={setStopLoss} />
            </div>
          ) : null}

          <button className="betButton" type="button" onClick={mode === "auto" ? startAuto : () => placeBet("manual")}>
            {mode === "auto" ? (autoRunning ? `Stop Auto (${betsRemaining})` : "Start Autobet") : "Bet"}
          </button>
        </aside>

        <section className="playArea">
          <div className="resultHistory" aria-label="Recent rolls">
            {history.slice(0, 6).map((result) => (
              <span key={result.id} className={result.win ? "pill win" : "pill loss"}>
                {result.roll.toFixed(2)}
              </span>
            ))}
          </div>

          <div className="sliderWrap">
            <div className="scale">
              {[0, 25, 50, 75, 100].map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <div className="sliderShell">
              <div className="rangeTrack" style={{ background: winGradient }}>
                {lastRoll !== null ? (
                  <span
                    className={`rollMarker ${history[0]?.win ? "win" : "loss"}`}
                    style={{ left: `${lastRoll}%` }}
                  >
                    {lastRoll.toFixed(2)}
                  </span>
                ) : null}
              </div>
              <input
                aria-label="Dice target slider"
                className="diceSlider"
                min="2"
                max="98"
                step="0.01"
                value={sliderValue}
                type="range"
                onChange={(event) => syncFromRoll(Number(event.target.value))}
              />
            </div>
            <div className="mobileHint">
              <span>{direction === "over" ? "Roll over" : "Roll under"}</span>
              <strong>{rollTarget.toFixed(2)}</strong>
            </div>
          </div>

          <div className="statsPanel">
            <MetricInput
              label="Multiplier"
              value={multiplier.toFixed(4)}
              suffix="x"
              onChange={(value) => syncFromMultiplier(Number(value))}
            />
            <MetricInput
              label={direction === "over" ? "Roll Over" : "Roll Under"}
              value={rollTarget.toFixed(2)}
              suffix={<RotateCcw size={18} />}
              onChange={(value) => syncFromRoll(Number(value))}
              onSuffixClick={toggleDirection}
            />
            <MetricInput
              label="Win Chance"
              value={winChance.toFixed(4)}
              suffix="%"
              onChange={(value) => syncFromChance(Number(value))}
            />
          </div>
        </section>

        <footer className="gameFooter">
          <nav aria-label="Game actions">
            <button type="button" aria-label="Settings">
              <Settings size={17} />
            </button>
            <button type="button" aria-label="Layout">
              <span className="squareIcon" />
            </button>
            <button type="button" aria-label="Statistics">
              <BarChart3 size={17} />
            </button>
            <button type="button" aria-label="Favorite">
              <Star size={17} />
            </button>
          </nav>
          <button className="fairness" type="button">
            Fairness
          </button>
        </footer>
      </section>
    </main>
  );
}

function CompactInput({
  label,
  value,
  min,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="compactField">
      <span>{label}</span>
      <div>
        <input
          type="number"
          min={min}
          value={value}
          onChange={(event) => onChange(Math.max(min, Number(event.target.value) || min))}
        />
        {suffix ? <b>{suffix}</b> : null}
      </div>
    </label>
  );
}

function MetricInput({
  label,
  value,
  suffix,
  onChange,
  onSuffixClick,
}: {
  label: string;
  value: string;
  suffix: ReactNode;
  onChange: (value: string) => void;
  onSuffixClick?: () => void;
}) {
  return (
    <label className="metric">
      <span>{label}</span>
      <div>
        <input type="number" value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="button" onClick={onSuffixClick} aria-label={onSuffixClick ? "Toggle roll direction" : undefined}>
          {suffix}
        </button>
      </div>
    </label>
  );
}
