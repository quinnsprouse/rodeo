import { links } from "@/demo/links";
import { InlineLink } from "@/demo/philosophy/inline-link";

const pocockSkills = "https://github.com/mattpocock/skills";
const stack = [
  { name: "vite+", href: links.vitePlus },
  { name: "tanstack start", href: links.tanstackStart },
  { name: "react", href: links.react },
  { name: "tailwind", href: links.tailwind },
  { name: "shadcn/ui", href: links.shadcn },
  { name: "base ui", href: links.baseUi },
  { name: "nitro", href: links.nitro },
];

function stackSeparator(index: number) {
  if (index === stack.length - 1) return ".";
  return index === stack.length - 2 ? " and " : ", ";
}

export function Acknowledgements() {
  return (
    <>
      <p>
        huge thanks to poteto. the pyramid comes from{" "}
        <InlineLink href={links.potetoPost}>their post on x</InlineLink>, and so does the idea of
        killing comments.
      </p>
      <p>
        thanks to matt pocock too. <InlineLink href={pocockSkills}>his skills</InlineLink> and his
        focus on what matters now that agents write the code helped me narrow rodeo down a lot.
      </p>
      <p>
        rodeo is built on{" "}
        {stack.map((tool, index) => (
          <span key={tool.name}>
            <InlineLink href={tool.href}>{tool.name}</InlineLink>
            {stackSeparator(index)}
          </span>
        ))}{" "}
        thank you all.
      </p>
    </>
  );
}
