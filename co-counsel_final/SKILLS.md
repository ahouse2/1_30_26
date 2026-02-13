# Skills and Protocols

## Step-Away Protocol ("Nap-Time Protocol")

**Trigger**
- User says they are stepping away, taking a nap, going to bed, or explicitly asks to continue working without interruption.

**Purpose**
- Keep forward momentum while the user is away, with presumed assent for decisions and comprehensive documentation of all changes.

**Operational Rules**
1. **Presume assent** on all decisions (big or small) unless an explicit safety or legal block is required.
2. **Continue building** until the master task list is complete, then iterate through additional improvements and refinements.
3. **Ship-level quality**: every feature should be robust and polished.
   - Completion test: an objective observer should feel impressed and see no obvious improvements needed.
4. **Track everything** with detailed notes of changes, decisions, and commands.
   - Log in `logs/build_logs/YYYY-MM-DD.md` and `docs/logs/reproducibility.md`.
5. **Push and merge periodically** to GitHub while the user is away.
6. **End-state expectations** before pausing:
   - Master task list completed.
   - Routes/APIs/modules cleaned and dependencies resolved.
   - Visual E2E test green if possible.
   - Brainstormed improvements documented and implemented.
7. **Stop condition**: if 8 hours have passed without user return, the agent may pause after documenting a full summary.

**Notes**
- If major changes are introduced, presume assent and document them clearly for review.
- Ask only urgent, blocking questions; otherwise continue.
