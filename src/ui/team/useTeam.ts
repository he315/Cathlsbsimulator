// React glue for the team and the audio engine.

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Team } from "../../simulation/team/team";
import type { Order, Utterance } from "../../simulation/team/types";
import type { AudioEngine, AudioSettings } from "../../audio/engine";

/** The most recent utterances (re-renders on each new one, batched). */
export function useUtterances(team: Team | null, limit = 40): Utterance[] {
  const [list, setList] = useState<Utterance[]>(() => (team ? team.st.utterances.slice(-limit) : []));
  useEffect(() => {
    if (!team) return;
    setList(team.st.utterances.slice(-limit));
    // batch bursts of lines into one render (a timer, not requestAnimationFrame, so captions also
    // update in a background tab)
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      setList(team.st.utterances.slice(-limit));
    };
    const off = team.bus.on("utterance", () => {
      if (timer === null) timer = setTimeout(flush, 16);
    });
    return () => {
      off();
      if (timer !== null) clearTimeout(timer);
    };
  }, [team, limit]);
  return list;
}

function openOrder(team: Team): Order | null {
  const t = team.t;
  for (let k = team.st.orders.length - 1; k >= 0; k--) {
    const x = team.st.orders[k];
    if (x.status === "queried" && t - x.t < 60) return x;
    if (x.readbackAt !== undefined && x.ackAt === undefined && x.rejectedAt === undefined && x.status !== "cancelled" && t - x.readbackAt <= team.P.ackWindowS) return x;
  }
  return null;
}

/** The latest order still waiting for the operator (a query, or a read-back not yet confirmed). */
export function useOpenOrder(team: Team | null): Order | null {
  const [o, setO] = useState<Order | null>(() => (team ? openOrder(team) : null));
  useEffect(() => {
    if (!team) return;
    const update = () => setO(openOrder(team));
    update();
    const offs = [team.bus.on("order", update), team.bus.on("utterance", update)];
    const iv = setInterval(update, 500);
    return () => {
      offs.forEach((f) => f());
      clearInterval(iv);
    };
  }, [team]);
  return o;
}

/** Audio settings, re-rendering on change. */
export function useAudioSettings(engine: AudioEngine): AudioSettings {
  return useSyncExternalStore(
    (cb) => engine.onChange(cb),
    () => engine.getSettings(),
    () => engine.getSettings()
  );
}
