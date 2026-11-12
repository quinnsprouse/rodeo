import { definePlugin } from "vite-plus/lint/plugins";

import { noComments } from "./rules/no-comments.js";
import { noDisableDirectives } from "./rules/no-disable-directives.js";
import { noImportMetaEnv } from "./rules/no-import-meta-env.js";
import { noModuleScopeBrowserGlobals } from "./rules/no-module-scope-browser-globals.js";
import { noStateFromProps } from "./rules/no-state-from-props.js";
import { noWindowNavigation } from "./rules/no-window-navigation.js";
import { serverFnRequiresValidator } from "./rules/server-fn-requires-validator.js";

const BROWSER_AND_OS_CAUSES = [
  "browser",
  "chrome",
  "chromium",
  "safari",
  "webkit",
  "firefox",
  "ios",
  "ipados",
  "android",
  "macos",
  "windows",
  "linux",
];
const WEB_STANDARD_CAUSES = [
  "html",
  "css",
  "dom",
  "svg",
  "spec",
  "specification",
  "rfc",
  "whatwg",
  "w3c",
  "ecmascript",
  "iso",
  "ieee",
  "wcag",
  "aria",
  "csp",
  "cors",
  "unicode",
];
const RUNTIME_AND_HOST_CAUSES = [
  "node",
  "nodejs",
  "v8",
  "deno",
  "bun",
  "workerd",
  "vercel",
  "cloudflare",
  "netlify",
  "heroku",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "nginx",
];
const DATA_STORE_CAUSES = [
  "postgres",
  "postgresql",
  "mysql",
  "sqlite",
  "sql",
  "redis",
  "mongodb",
  "mongo",
  "dynamodb",
  "elasticsearch",
  "kafka",
  "s3",
  "indexeddb",
];
const PROTOCOL_AND_FORMAT_CAUSES = [
  "http",
  "websocket",
  "tls",
  "ssl",
  "dns",
  "smtp",
  "oauth",
  "oidc",
  "jwt",
  "json",
  "xml",
  "yaml",
  "csv",
  "utf",
  "posix",
];
const TIME_CAUSES = ["utc", "time zone", "daylight", "iana"];
const SERVICE_CAUSES = [
  "stripe",
  "paypal",
  "shopify",
  "github",
  "gitlab",
  "google",
  "apple",
  "microsoft",
  "supabase",
  "firebase",
  "auth0",
  "okta",
  "twilio",
  "sendgrid",
  "mailgun",
  "postmark",
  "sentry",
  "datadog",
  "posthog",
  "openai",
  "anthropic",
  "algolia",
  "discord",
];
const DEPENDENCY_DISPLAY_NAMES = ["base ui", "tailwind"];
const KNOWN_CAUSES = [
  ...BROWSER_AND_OS_CAUSES,
  ...WEB_STANDARD_CAUSES,
  ...RUNTIME_AND_HOST_CAUSES,
  ...DATA_STORE_CAUSES,
  ...PROTOCOL_AND_FORMAT_CAUSES,
  ...TIME_CAUSES,
  ...SERVICE_CAUSES,
  ...DEPENDENCY_DISPLAY_NAMES,
];
export const pluginName = "rodeo";

export const defaultCommentOptions = { cause: "required", minWords: 6, maxWords: 30 };

export const rules = {
  "no-disable-directives": noDisableDirectives,
  "no-comments": noComments({ defaultOptions: defaultCommentOptions, knownCauses: KNOWN_CAUSES }),
  "no-import-meta-env": noImportMetaEnv,
  "server-fn-requires-validator": serverFnRequiresValidator,
  "no-state-from-props": noStateFromProps,
  "no-module-scope-browser-globals": noModuleScopeBrowserGlobals,
  "no-window-navigation": noWindowNavigation,
};

export default definePlugin({ meta: { name: pluginName }, rules });
