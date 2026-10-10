import { useSimulatorStore } from "../../state/useSimulatorStore";
import { generateRandomCase } from "../../simulation/caseGenerator";
import { useProgressStore } from "../../state/useProgressStore";
import { uid } from "../../utils/random";
import Simulator from "../sim/Simulator";

export default function FreeLab() {
  const loadCase = useSimulatorStore((s) => s.loadCase);
  const difficulty = useProgressStore((s) => s.profile.difficulty);

  const newRandom = () => {
    const c = generateRandomCase(uid());
    loadCase(c, "free", difficulty);
  };

  return (
    <Simulator
      title="Free cath lab"
      headerActions={
        <button className="btn" onClick={newRandom}>
          New random case
        </button>
      }
    />
  );
}
