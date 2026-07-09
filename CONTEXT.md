# Rodeo Starter Context

Rodeo is a starter kit for agent-assisted product development. Its domain is the feedback system that turns a freshly copied template into a trustworthy working repository.

## Language

**Starter Journey**:
The path from copying Rodeo into a Git-less directory through Git initialization, installation, hook setup, verification, and first development run.
_Avoid_: Bootstrap flow, onboarding flow

**Starter Contract**:
The observable promises Rodeo makes to a new repository, including installed hooks, working verification profiles, a bootable production build, and executable tests.
_Avoid_: Scaffold assumptions, setup checklist

**Feedback Loop**:
The ordered checks that return failures while an agent still has enough local context to repair them.
_Avoid_: Toolchain, pipeline

**Verification Profile**:
A named depth of the Feedback Loop. Rodeo has Fast, Push, and CI profiles, each extending the guarantees of the previous profile.
_Avoid_: Script bundle, command preset

**Fast Profile**:
The local Verification Profile for formatting, linting, type checking, and unit tests.
_Avoid_: Basic check, quick tests

**Push Profile**:
The pre-push Verification Profile that adds a production build, dead-code analysis, and browser tests to the Fast Profile.
_Avoid_: Full check, release check

**CI Profile**:
The repository Verification Profile that adds coverage, the clean Starter Journey, React health, and dependency audit to the Push Profile.
_Avoid_: GitHub check, remote gate

**Edit Feedback**:
Portable, project-owned formatting and type diagnostics returned immediately after an agent writes code.
_Avoid_: Claude magic, local hook script

## Relationships

- The **Starter Journey** must satisfy the **Starter Contract**.
- The **Feedback Loop** is expressed through three **Verification Profiles**.
- The **Push Profile** contains the **Fast Profile**; the **CI Profile** contains the **Push Profile**.
- **Edit Feedback** is the earliest layer of the **Feedback Loop**.

## Example dialogue

> Developer: “The Fast Profile is green. Is this ready to push?”
>
> Domain expert: “Run the Push Profile. It adds the production build, dead-code analysis, and browser behavior.”
>
> Developer: “What proves a new repository gets the same guarantees?”
>
> Domain expert: “The CI Profile replays the Starter Journey and verifies the Starter Contract in a clean copy.”
