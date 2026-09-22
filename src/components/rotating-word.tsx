import { Calligraph } from "calligraph";
import { useEffect, useState } from "react";

const words = ["agents.", "humans.", "teams.", "you."] as const;

export function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let id: number;

    function start() {
      id = window.setInterval(() => {
        setIndex((prev) => (prev + 1) % words.length);
      }, 2500);
    }

    function handleVisibility() {
      window.clearInterval(id);
      if (!document.hidden) start();
    }

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <Calligraph as="span" className="text-brand" animation="smooth" trend={1}>
      {words[index] ?? words[0]}
    </Calligraph>
  );
}
