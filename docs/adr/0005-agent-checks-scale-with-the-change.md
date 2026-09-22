# Agent checks scale with the change

The Stop hook checks only the files changed since the last commit, and it skips a working tree that already passed. A full check on every turn would slow agents more as the project grows, while the commit and push gates still run the whole suite.
