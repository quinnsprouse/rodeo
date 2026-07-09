# Verification profiles live in Vite Task

Fast, Push, and CI Verification Profiles are defined once in the Vite Task graph, while package scripts, hooks, and CI remain thin adapters. This keeps check ordering and caching local to one module and prevents the guarantees advertised by each profile from drifting across callers.
