// Read source only; never import server modules (they connect to the database/start jobs).
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

interface Route { method: string; path: string }
const indexFile = path.resolve("server/index.ts");
const index = ts.createSourceFile(indexFile, fs.readFileSync(indexFile, "utf8"), ts.ScriptTarget.Latest, true);
const imports = new Map<string, { file: string; exported: string }>();
for (const node of index.statements) {
  if (!ts.isImportDeclaration(node) || !node.importClause || !ts.isStringLiteral(node.moduleSpecifier)) continue;
  const file = path.resolve("server", node.moduleSpecifier.text + ".ts");
  const clause = node.importClause;
  if (clause.name) imports.set(clause.name.text, { file, exported: "default" });
  if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
    for (const item of clause.namedBindings.elements) imports.set(item.name.text, { file, exported: item.propertyName?.text || item.name.text });
  }
}

function readRoutes(file: string, exported: string): Route[] {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const constants = new Map<string, ts.Expression>();
  let router = exported;
  function collect(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) constants.set(node.name.text, node.initializer);
    if (exported === "default" && ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) router = node.expression.text;
    ts.forEachChild(node, collect);
  }
  collect(source);
  function value(node: ts.Expression): string | undefined {
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isIdentifier(node) && constants.has(node.text)) return value(constants.get(node.text)!);
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = value(node.left), right = value(node.right);
      if (left !== undefined && right !== undefined) return left + right;
    }
  }
  const routes: Route[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && node.expression.expression.getText(source) === router && node.arguments[0]) {
      const method = node.expression.name.text.toUpperCase();
      const route = value(node.arguments[0]);
      if (["GET", "POST", "PUT", "DELETE"].includes(method) && route?.startsWith("/")) {
        routes.push({ method, path: "/api" + route.replace(/:[A-Za-z]+/g, "zz-smoke-nonexistent") });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return routes;
}

// Follow every router in the requireUser app.use mount, including named exports.
const protectedNames: string[] = [];
function mounts(node: ts.Node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
    && node.expression.getText(index) === "app.use"
    && node.arguments.some((arg) => ts.isIdentifier(arg) && arg.text === "requireUser")) {
    for (const arg of node.arguments) if (ts.isIdentifier(arg) && imports.has(arg.text)) protectedNames.push(arg.text);
  }
  ts.forEachChild(node, mounts);
}
mounts(index);
export const families = protectedNames.filter((name) => !["requireUser", "requireVerified", "sectionGate", "aiQuota"].includes(name)).map((name) => {
  const item = imports.get(name)!;
  const routes = readRoutes(item.file, item.exported);
  const route = routes.find((r) => r.method === "GET") || routes.find((r) => r.method === "POST");
  if (!route) throw new Error(`No representative route found for ${name}; update the live probe parser.`);
  return { name, ...route };
});
if (!families.length) throw new Error("No protected router mounts found");
export const adminReads = [...new Map([...imports.values()]
  .filter((item) => fs.existsSync(item.file))
  .flatMap((item) => readRoutes(item.file, item.exported))
  .filter((r) => r.method === "GET" && r.path.startsWith("/api/admin/"))
  .map((r) => [r.path, r])).values()];
