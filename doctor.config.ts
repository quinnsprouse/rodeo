import type { ReactDoctorConfig } from "react-doctor/api";

export default {
  ignore: {
    overrides: [
      {
        // useMountEffect is this template's sanctioned useEffect wrapper — it
        // intentionally runs once with an empty deps array, so the
        // exhaustive-deps heuristic ("callback defined elsewhere") is a false
        // positive here. See docs/agents/REACT_PATTERNS.md.
        files: ["src/hooks/use-mount-effect.ts"],
        rules: ["react-doctor/exhaustive-deps"],
      },
    ],
  },
} satisfies ReactDoctorConfig;
