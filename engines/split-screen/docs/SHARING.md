# Share a clean community kit

Share the reusable project ZIP with the quick-start instructions. Each member should unzip a separate working copy, open it as a local project, and place their footage in `inputs/`.

Maintainers can run `npm run package` to create `dist/Split-Screen-Editor-v0.1.0.zip`. Packaging requires Python 3; ordinary rendering does not. The packager uses a curated file list, verifies ZIP integrity, and resets the distributed edit history. The version in the ZIP name follows `package.json`.

Include source code, lockfile, instructions, prompts, schemas, reference metadata/annotations, original demonstration assets, and explicitly curated official assets with their source/license records. The MiroFish example uses the bundled GitHub mark and actual app screenshot documented in `public/assets/mirofish/README.md`. Exclude `node_modules/`, browser downloads, user footage, extracted audio, private transcripts, member jobs/renders, environment files, credentials, and personal edit history. Dependencies are installed on each member's computer.

The kit contains original code and documented reference observations. Instagram source URLs are references; the downloadable kit should not bundle the creator's reels or extracted artwork. Members can annotate footage they supply or can access appropriately and retain it privately. A reference annotation does not establish redistribution permission.

Before releasing an updated kit, try the documented install from a clean folder, run the included checks, and render the bundled original demo. Record the tested platform and actual result. Do not advertise support for an operating system or ChatGPT surface solely because it should work in principle.

Keep the project's own license and dependency notices in the distribution. Remotion and other dependencies have their own terms; the kit's license does not replace those terms.
