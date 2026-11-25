import { PageSection } from "@/demo/landing/page-section";
import { WebMcpSticker } from "@/demo/stickers/brand";
import { useTheme } from "@/hooks/use-theme";

function componentsAnAgentSees(theme: "light" | "dark") {
  return [
    {
      component: "button",
      label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      action: "press",
    },
    { component: "tabs", label: "When Rodeo checks", action: "setValue" },
    { component: "button", label: "Copy the install command", action: "press" },
  ];
}

export function WebMcpSection() {
  const theme = useTheme();

  return (
    <PageSection>
      <WebMcpSticker className="-ml-1 h-16 w-auto" />
      <h2 className="mt-s font-brand text-l font-heavy text-foreground">
        Agents can use the app too.
      </h2>
      <p className="mt-s max-w-[520px] text-muted-foreground">
        UI SDK components report their name, state, and actions to one bridge registered with WebMCP
        as three tools. In browsers with WebMCP, an agent switches a tab by calling its action
        instead of clicking coordinates from a screenshot. Other browsers never download the bridge.
      </p>

      <table className="mt-xl w-full max-w-[520px] text-left font-data text-s">
        <caption className="mb-s text-left font-ui text-s text-muted-foreground">
          Three controls an agent sees here
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Component</th>
            <th scope="col">Name</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {componentsAnAgentSees(theme).map(({ component, label, action }) => (
            <tr key={label} className="divider-t">
              <td className="py-xs pr-m text-muted-foreground">{component}</td>
              <th scope="row" className="py-xs pr-m font-regular text-foreground">
                {label}
              </th>
              <td className="py-xs text-right text-muted-foreground">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PageSection>
  );
}
