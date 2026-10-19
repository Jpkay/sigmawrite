import {afterAll, beforeAll, expect, it} from "vitest";
import {mkdtemp, mkdir, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {createRequire} from "node:module";
import {join, parse, relative} from "node:path";
import {Linter} from "eslint";

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve("@next/eslint-plugin-next"));
const nextPlugin = require("@next/eslint-plugin-next");
const {getRootDirs} = require("@next/eslint-plugin-next/dist/utils/get-root-dirs.js") as {
  getRootDirs(context: {cwd: string; settings: {next?: {rootDir?: string | string[]}}}): string[];
};

// Next's plugin only uses fast-glob.globSync with onlyDirectories. The scoped
// scoped compatibility shim removes unpatched braces (GHSA-vfj7-8cjw-p6xm). Keep these
// actual-plugin contracts when upgrading Next; remove the override once its
// upstream glob dependency no longer brings in the vulnerable chain. The shim
// preserves fast-glob's literal directory and path formatting behavior rather
// than inheriting tinyglobby's directory expansion defaults.
let root: string;
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "next-eslint-glob-"));
  await Promise.all(["packages/alpha/pages", "packages/beta", "apps/web/app/contact"].map(dir => mkdir(join(root, dir), {recursive: true})));
  await writeFile(join(root, "packages", "notes.txt"), "not an app directory");
  await writeFile(join(root, "packages/alpha/pages/about.tsx"), "export default function About() { return null; }");
  await writeFile(join(root, "apps/web/app/contact/page.tsx"), "export default function Contact() { return null; }");
  await writeFile(join(root, "apps/web/app/page.tsx"), "export default function Home() { return null; }");
});
afterAll(async () => { await rm(root, {recursive: true, force: true}); });

const roots = (rootDir?: string | string[]) => getRootDirs({cwd: root, settings: {next: {rootDir}}}).sort();

it("resolves the reviewed shim and glob implementation from the actual Next plugin", () => {
  expect(pluginRequire("fast-glob/package.json")).toMatchObject({name: "@plume/next-eslint-glob", version: "1.0.0"});
  const shimRequire = createRequire(pluginRequire.resolve("fast-glob"));
  expect(shimRequire("tinyglobby/package.json")).toMatchObject({version: "0.2.17"});
  expect(typeof pluginRequire("fast-glob").globSync).toBe("function");
});

it("keeps the default working directory without a root setting", () => {
  expect(getRootDirs({cwd: root, settings: {}})).toEqual([root]);
});

it("matches only directories for an absolute string glob", () => {
  expect(roots(`${root}/packages/*`)).toEqual([join(root, "packages/alpha"), join(root, "packages/beta")].sort());
});

it("keeps relative root patterns relative to the process working directory", () => {
  const prefix = relative(process.cwd(), root);
  expect(roots(`${prefix}/packages/*`)).toEqual([join(prefix, "packages/alpha"), join(prefix, "packages/beta")].sort());
});

it("combines array root patterns", () => {
  expect(roots([`${root}/packages/alpha`, `${root}/apps/*`])).toEqual([join(root, "packages/alpha"), join(root, "apps/web")].sort());
});

it("supports brace alternatives while excluding files", () => {
  expect(roots(`${root}/{packages,apps}/*`)).toEqual([join(root, "packages/alpha"), join(root, "packages/beta"), join(root, "apps/web")].sort());
});

it("returns no roots for a missing directory pattern", () => {
  expect(roots(`${root}/missing-*`)).toEqual([]);
});

it("keeps a literal filesystem root rather than substituting the working directory", () => {
  const filesystemRoot = parse(root).root;
  expect(roots(filesystemRoot)).toEqual([filesystemRoot]);
});

it.each(["string", "array", "brace"])("keeps the real Next link rule active with %s roots", mode => {
  const rootDir = mode === "string" ? `${root}/packages/*`
    : mode === "array" ? [`${root}/packages/*`, `${root}/apps/*`]
    : `${root}/{packages,apps}/*`;
  const code = `<><a href="/about">About</a><a href="/">Home</a><a href="https://example.com/about">External</a></>`;
  const messages = new Linter().verify(code, {
    languageOptions: {parserOptions: {ecmaVersion: "latest", sourceType: "module", ecmaFeatures: {jsx: true}}},
    plugins: {"@next/next": nextPlugin},
    settings: {next: {rootDir}},
    rules: {"@next/next/no-html-link-for-pages": "error"},
  });
  expect(messages).toHaveLength(mode === "string" ? 1 : 2);
  expect(messages.every(message => message.ruleId === "@next/next/no-html-link-for-pages")).toBe(true);
  expect(messages[0].message).toContain("`/about/`");
  if (mode !== "string") expect(messages[1].message).toContain("`/`");
});

it("fails loudly if a future Next plugin asks for an unsupported glob API", () => {
  const {globSync} = pluginRequire("fast-glob");
  expect(() => globSync([root], {onlyDirectories: true})).toThrow(TypeError);
  expect(() => globSync(root, {onlyDirectories: false})).toThrow(TypeError);
  expect(() => globSync(root, {onlyDirectories: true, dot: true})).toThrow(TypeError);
});
