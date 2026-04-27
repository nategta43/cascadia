import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const STORAGE_KEY = "cascadia-scorepad-v2";

export const initialScore = {
  playerName: "",
  wildlife: {
    bear: 1,
    elk: 1,
    fox: 1,
    hawk: 1,
    salmon: 1,
    natureTokens: 2,
  },
  habitats: {
    forest: 0,
    mountain: 0,
    prairie: 0,
    wetland: 0,
    river: 0,
    habitatBonus: 0,
  },
};

const categories = [
  { key: "bear", label: "Bear", image: "/wildlife/bear.png" },
  { key: "elk", label: "Elk", image: "/wildlife/elk.png" },
  { key: "fox", label: "Fox", image: "/wildlife/fox.png" },
  { key: "hawk", label: "Hawk", image: "/wildlife/hawk.png" },
  { key: "salmon", label: "Salmon", image: "/wildlife/salmon.png" },
  { key: "natureTokens", label: "Nature", image: "/wildlife/nature.png" },
];

function createEmptyHistory() {
  return categories.reduce((history, category) => {
    history[category.key] = [];
    return history;
  }, {});
}

function createStartingHistory(wildlifeValues) {
  return categories.reduce((history, category) => {
    history[category.key] = [
      {
        txId: 1,
        delta: 0,
        total: Number(wildlifeValues?.[category.key] || 0),
        timestamp: new Date().toISOString(),
        isInitial: true,
      },
    ];
    return history;
  }, {});
}

export function sumScoreValues(values) {
  return Object.values(values).reduce((sum, value) => sum + Number(value || 0), 0);
}

export function addWildlifeScore(score, key, amount) {
  if (!Object.prototype.hasOwnProperty.call(score.wildlife, key)) return score;

  return {
    ...score,
    wildlife: {
      ...score.wildlife,
      [key]: Math.max(0, Number(score.wildlife[key] || 0) + Number(amount || 0)),
    },
  };
}

function getSavedScore() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialScore;

    const parsed = JSON.parse(saved);

    return {
      playerName: parsed.playerName || "",
      wildlife: {
        ...initialScore.wildlife,
        ...(parsed.wildlife || {}),
      },
      habitats: {
        ...initialScore.habitats,
        ...(parsed.habitats || {}),
      },
    };
  } catch {
    return initialScore;
  }
}

function WildlifeIcon({ label, image, fallback }) {
  if (image) {
    return <img className="wildlife-image" src={image} alt={`${label} token`} />;
  }

  return (
    <div className="nature-token-icon" aria-label={`${label} token`}>
      {fallback}
    </div>
  );
}

function StepperInput({ label, image, fallback, value, onAccept, onOpenHistory }) {
  const [draftValue, setDraftValue] = useState(0);
  const hasPendingChange = draftValue !== 0;
  const minDraftValue = -Number(value || 0);
  const canDecrement = draftValue > minDraftValue;

  const increment = () => setDraftValue((current) => current + 1);
  const decrement = () => {
    setDraftValue((current) => Math.max(minDraftValue, current - 1));
  };

  const acceptValue = () => {
    if (!hasPendingChange) return;
    onAccept(draftValue);
    setDraftValue(0);
  };

  return (
    <article className="score-row">
      <div className="animal-info">
        <button
          type="button"
          className="wildlife-icon-button"
          onClick={onOpenHistory}
          aria-label={`Show ${label} history`}
          title={`Show ${label} history`}
        >
          <WildlifeIcon label={label} image={image} fallback={fallback} />
        </button>
        <div className="animal-stats">
          <div className="animal-value">{value}</div>
          <div className="animal-label">{label}</div>
        </div>
      </div>

      <div className="stepper" aria-label={`${label} score input`}>
        <button
          type="button"
          className="round-button muted"
          onClick={decrement}
          disabled={!canDecrement}
          aria-label={`Subtract from ${label}`}
        >
          −
        </button>

        <div className={hasPendingChange ? "draft-value active" : "draft-value"} aria-live="polite">
          {draftValue}
        </div>

        <button
          type="button"
          className="round-button muted"
          onClick={increment}
          aria-label={`Add to ${label}`}
        >
          +
        </button>

        <button
          type="button"
          className={hasPendingChange ? "check-button active" : "check-button"}
          onClick={acceptValue}
          disabled={!hasPendingChange}
          aria-label={`Accept ${label} change`}
          title="Apply this change"
        >
          ✓
        </button>
      </div>
    </article>
  );
}

export default function CascadiaScorepadApp() {
  const [score, setScore] = useState(initialScore);
  const [isEditingName, setIsEditingName] = useState(false);
  const [historyByCategory, setHistoryByCategory] = useState(() =>
    createStartingHistory(initialScore.wildlife),
  );
  const [activeHistoryKey, setActiveHistoryKey] = useState(null);

  useEffect(() => {
    const savedScore = getSavedScore();
    setScore(savedScore);
    setHistoryByCategory(createStartingHistory(savedScore.wildlife));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
  }, [score]);

  const wildlifeTotal = useMemo(() => sumScoreValues(score.wildlife), [score.wildlife]);
  const activeHistoryCategory = useMemo(
    () => categories.find((category) => category.key === activeHistoryKey),
    [activeHistoryKey],
  );
  const activeHistory = activeHistoryKey ? historyByCategory[activeHistoryKey] || [] : [];

  const handleAcceptWildlifeScore = (key, amount) => {
    setScore((currentScore) => {
      const currentValue = Number(currentScore.wildlife[key] || 0);
      const nextScore = addWildlifeScore(currentScore, key, amount);
      const nextValue = Number(nextScore.wildlife[key] || 0);
      const appliedDelta = nextValue - currentValue;

      if (appliedDelta !== 0) {
        setHistoryByCategory((currentHistory) => {
          const existingEntries = currentHistory[key] || [];
          const nextTxId = existingEntries.length + 1;

          return {
            ...currentHistory,
            [key]: [
              ...existingEntries,
              {
                txId: nextTxId,
                delta: appliedDelta,
                total: nextValue,
                timestamp: new Date().toISOString(),
                isInitial: false,
              },
            ],
          };
        });
      }

      return nextScore;
    });
  };

  const updatePlayerName = (event) => {
    setScore((current) => ({
      ...current,
      playerName: event.target.value,
    }));
  };

  const finishEditingName = () => {
    setIsEditingName(false);
  };

  const resetScores = () => {
    const shouldReset = window.confirm("Reset all wildlife scores? This cannot be undone.");
    if (!shouldReset) return;

    setScore((current) => ({
      ...initialScore,
      playerName: current.playerName,
    }));
    setHistoryByCategory(createStartingHistory(initialScore.wildlife));
    setActiveHistoryKey(null);
  };

  const openHistory = (key) => {
    setActiveHistoryKey(key);
  };

  const closeHistory = () => {
    setActiveHistoryKey(null);
  };

  return (
    <main className="app-shell">
      {/* <div className="hero-background">
        <header className="hero-content">
          <h1>Cascadia Scorepad</h1>
          <p className="hero-subtle">designed and built by Nate + Claude</p>
        </header>
      </div> */}

      <div className="app-container">
        <section className="name-card" aria-label="Player name">
          {isEditingName ? (
            <input
              className="player-name-input"
              type="text"
              value={score.playerName}
              onChange={updatePlayerName}
              onBlur={finishEditingName}
              onKeyDown={(event) => {
                if (event.key === "Enter") finishEditingName();
              }}
              autoFocus
              placeholder="Player"
            />
          ) : (
            <div className="player-name-row">
              <button
                type="button"
                className="player-name-display"
                onClick={() => setIsEditingName(true)}
                aria-label="Edit player name"
              >
                {score.playerName || "Player"}
              </button>
              <button
                type="button"
                className="edit-name-button"
                onClick={() => setIsEditingName(true)}
                aria-label="Edit player name"
              >
                ✎
              </button>
            </div>
          )}
        </section>

        <section className="score-list" aria-label="Wildlife and nature token inputs">
          {categories.map((category) => (
            <StepperInput
              key={category.key}
              label={category.label}
              image={category.image}
              fallback={category.fallback}
              value={score.wildlife[category.key]}
              onAccept={(amount) => handleAcceptWildlifeScore(category.key, amount)}
              onOpenHistory={() => openHistory(category.key)}
            />
          ))}
        </section>

        <button type="button" className="reset-button" onClick={resetScores}>
          <span aria-hidden="true">↻</span>
        </button>

        <p className="hidden-total" aria-label={`Current wildlife total is ${wildlifeTotal}`}>
          Wildlife total: {wildlifeTotal}
        </p>
      </div>

      {activeHistoryCategory ? (
        <div className="history-modal-backdrop" role="presentation" onClick={closeHistory}>
          <section
            className="history-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeHistoryCategory.label} history`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="history-header">
              <h2>{activeHistoryCategory.label} History</h2>
              <button
                type="button"
                className="history-close-button"
                onClick={closeHistory}
                aria-label="Close history"
              >
                ×
              </button>
            </header>

            {activeHistory.length > 0 ? (
              <ul className="history-list">
                {activeHistory.map((entry) => (
                  <li className="history-item" key={`${activeHistoryKey}-${entry.txId}-${entry.timestamp}`}>
                    <span className="history-id">#{entry.txId}</span>
                    {entry.isInitial ? (
                      <span className="history-delta neutral">Start</span>
                    ) : (
                      <span className={entry.delta > 0 ? "history-delta increase" : "history-delta decrease"}>
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </span>
                    )}
                    <span className="history-total-value">Total: {entry.total}</span>
                    <time className="history-time" dateTime={entry.timestamp}>
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="history-empty">No changes yet for this row.</p>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
