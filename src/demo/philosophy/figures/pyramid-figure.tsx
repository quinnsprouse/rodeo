import { Figure, useFigure } from "@/demo/philosophy/figures/figure";
import { PyramidDiagram } from "@/demo/pyramid-diagram";

export function PyramidFigure() {
  const figure = useFigure();

  return (
    <Figure figure={figure} caption="most of the work happens at the top." cardClassName="py-xl">
      <PyramidDiagram size="compact" playback={figure.playback} sheen />
    </Figure>
  );
}
