import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const STORAGE_KEY = "cascadia-scorepad-v2";

export const initialScore = {
  playerName: "",
  wildlife: {
    bear: 0,
    elk: 0,
    fox: 0,
    hawk: 0,
    salmon: 0,
    natureTokens: 0,
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
  { key: "natureTokens", label: "Nature Tokens", fallback: "🌲" },
];

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

function StepperInput({ label, image, fallback, value, onAccept }) {
  const [draftValue, setDraftValue] = useState(0);
  const hasPendingChange = draftValue !== 0;

  const increment = () => setDraftValue((current) => current + 1);
  const decrement = () => setDraftValue((current) => current - 1);

  const acceptValue = () => {
    if (!hasPendingChange) return;
    onAccept(draftValue);
    setDraftValue(0);
  };

  return (
    <article className="score-row">
      <div className="animal-info">
        <WildlifeIcon label={label} image={image} fallback={fallback} />
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

  useEffect(() => {
    setScore(getSavedScore());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
  }, [score]);

  const wildlifeTotal = useMemo(() => sumScoreValues(score.wildlife), [score.wildlife]);

  const handleAcceptWildlifeScore = (key, amount) => {
    setScore((current) => addWildlifeScore(current, key, amount));
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
    setScore((current) => ({
      ...initialScore,
      playerName: current.playerName,
    }));
  };

  return (
    <main className="app-shell">
      <div className="hero-background">
        <header className="hero-content">
          <h1>Cascadia Scorepad</h1>
          <p className="hero-subtle">designed and built by Nate + Claude</p>
        </header>
      </div>

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
            />
          ))}
        </section>

        <button type="button" className="reset-button" onClick={resetScores}>
          <span aria-hidden="true">↻</span>
          Reset Scorepad
        </button>

        <p className="save-note">Your scores are saved automatically on this device.</p>
        <p className="hidden-total" aria-label={`Current wildlife total is ${wildlifeTotal}`}>
          Wildlife total: {wildlifeTotal}
        </p>
      </div>
    </main>
  );
}
