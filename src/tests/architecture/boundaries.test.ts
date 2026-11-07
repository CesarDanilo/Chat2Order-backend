import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "../..");
const MODULES = path.join(SRC, "modules");

const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : full.endsWith(".ts") ? [full] : [];
  });

const IMPORT = /(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g;

const importsOf = (file: string) =>
  [...fs.readFileSync(file, "utf8").matchAll(IMPORT)].map((match) =>
    path.resolve(path.dirname(file), match[1]),
  );

const moduleOf = (file: string) => {
  const relative = path.relative(MODULES, file);
  return relative.startsWith("..") ? null : relative.split(path.sep)[0];
};

const moduleNames = fs.readdirSync(MODULES);
const moduleFiles = listFiles(MODULES);

describe("arquitetura modular", () => {
  it("cada módulo tem um index.ts público", () => {
    for (const name of moduleNames) {
      expect(fs.existsSync(path.join(MODULES, name, "index.ts"))).toBe(true);
    }
  });

  it("módulos só usam outro módulo pelo index.ts", () => {
    const violations = moduleFiles.flatMap((file) =>
      importsOf(file)
        .filter((target) => {
          const owner = moduleOf(target);
          const publicEntry = [path.join(MODULES, owner ?? ""), path.join(MODULES, owner ?? "", "index")];
          return owner && owner !== moduleOf(file) && !publicEntry.includes(target);
        })
        .map((target) => `${path.relative(SRC, file)} -> ${path.relative(SRC, target)}`),
    );

    expect(violations).toEqual([]);
  });

  it("não há dependência circular entre módulos", () => {
    const graph = new Map<string, Set<string>>(moduleNames.map((name) => [name, new Set()]));

    for (const file of moduleFiles) {
      for (const target of importsOf(file)) {
        const from = moduleOf(file);
        const to = moduleOf(target);
        if (from && to && from !== to) graph.get(from)!.add(to);
      }
    }

    const reaches = (from: string, to: string, seen = new Set<string>()): boolean =>
      [...graph.get(from)!].some(
        (next) => next === to || (!seen.has(next) && (seen.add(next), reaches(next, to, seen))),
      );

    const cycles = moduleNames.filter((name) => reaches(name, name));

    expect(cycles).toEqual([]);
  });

  it("shared não depende de nenhum módulo", () => {
    const sharedFiles = listFiles(path.join(SRC, "shared"));
    const violations = sharedFiles.filter((file) => importsOf(file).some((target) => moduleOf(target)));

    expect(violations).toEqual([]);
  });

  it("domain não depende de HTTP, banco ou outras camadas", () => {
    const domainFiles = moduleFiles.filter((file) => file.includes(`${path.sep}domain${path.sep}`));
    const forbidden = /from\s*["'](express|groq-sdk|[^"']*shared\/(database|http)[^"']*|\.\.\/(application|infrastructure|presentation)[^"']*)["']/;

    const violations = domainFiles.filter((file) => forbidden.test(fs.readFileSync(file, "utf8")));

    expect(violations).toEqual([]);
  });
});
