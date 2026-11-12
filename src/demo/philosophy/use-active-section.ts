import { useEffect, useState } from "react";

const readingLine = 160;

function atPageBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
}

function onScreen(id: string) {
  const top = document.getElementById(id)?.getBoundingClientRect().top;
  return top !== undefined && top >= 0 && top < window.innerHeight;
}

export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | undefined>(ids[0]);

  useEffect(() => {
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (atPageBottom()) {
          const linked = window.location.hash.slice(1);
          setActive(ids.includes(linked) && onScreen(linked) ? linked : ids.at(-1));
          return;
        }
        const passed = ids.filter(
          (id) =>
            (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= readingLine,
        );
        setActive(passed.at(-1) ?? ids[0]);
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}
