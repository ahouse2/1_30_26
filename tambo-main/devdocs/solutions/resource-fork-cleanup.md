# Resource fork cleanup

Removed macOS resource fork files (the `._*` artifacts) across the repository to
avoid lint/test/typecheck tooling from scanning corrupted duplicates.
