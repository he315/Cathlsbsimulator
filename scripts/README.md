# scripts

Tools that run beside the app: content status, the angiogram library build, realism capture and
scoring, anatomy validation and thorax assets. Nothing here is bundled into the app.

## Running scripts that read content

Scripts that import anything under `src/content/` (or the lab `.launch.ts` files) run with
vite-node, never plain node or ts-node:

    npx vite-node scripts/content/status.ts > status.json

The content modules are collected with `import.meta.glob` (the manual curriculum in
`src/content/manual/index.ts`, the lab practice links in `src/ui/content/practiceIndex.ts`), and
only Vite's transform resolves those globs. `scripts/content/status.ts` calls `import.meta.glob`
itself on line 5. Glob patterns that start with `/` resolve from the repository root, so run the
scripts from there.

## Registries are discovered by glob

Registries that many work packages extend are found with `import.meta.glob(..., { eager: true })`
rather than a hand-edited index, so a package adds a file instead of editing a shared list
(docs/curriculum/LAB_BUILD_PLAN.md, section 2). The lab launch metadata works this way:

- Every lab declares its scenarios, start states, variants and drills in engine-free
  `src/**/*.launch.ts` files that export `launch: LaunchFile` (`src/content/schema.ts`). They
  import types only, so the content test, the practice index and node scripts can read them
  without loading an engine.
- A package that adds a start state or a drill to a scenario it does not own writes
  `src/content/practice/<package-id>.launch.ts` with a `links` entry (and `adds` for the new start).
- `src/content/content.test.ts` validates every lesson, module and case launch and every
  `.launch.ts` with `validateLaunchLinks` (`src/content/validateLaunch.ts`).
- `src/ui/content/practiceIndex.ts` builds 'Practise this in the lab' under every lesson and case
  a `.launch.ts` names. Scenarios marked `heldOut` are never listed or linked. Both build the
  known ids with `buildKnownLaunch`, whose default accepts the built-in Real angiograms drills
  (`BUILTIN_LAUNCH_DRILLS`), so a link the content test passes is one the index lists.
- Test fixtures live in `__fixtures__/` folders, which both globs exclude.
- At run time `useUiStore.openSim(sim, params)` leaves one pending request in
  `src/state/useLabLaunchStore.ts`, which the lab takes once with `useLabLaunch`. The latest link
  replaces any earlier request, and leaving the lab's section by any route drops it, so an old
  link never fires on a later visit. The rules are listed in that file's header.

## Folders

- `content/`: curriculum build status (`status.ts`, run as above; `build_status.py`, `overlap.py`).
- `angio_library/`: builds the local real-angiogram library under `datasets/library/`.
- `realism/`: renderer capture sets and scoring (`run_all.sh`, `compare_sets.py`).
- `anatomy_validation/`, `thorax/`: anatomy checks and thorax assets.
- `vite-angio-library.mjs`, `vite-build-status.mjs`: dev-server plugins used by `vite.config.ts`.
