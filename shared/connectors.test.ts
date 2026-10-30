import { describe, expect, it } from "vitest";
import {
  apsAuthorizeUrl, apsBasicAuth, apsFolderContentsUrl, apsNextHref, apsProjectsUrl, apsTokenBody, apsTopFoldersUrl, categoryOf, completeness, countBy, graphqlError,
  isBundleRef, isElement, isReadOnlyGraphql, mergeContents, normalizeApsUser, normalizeFolderContents, normalizeHubs, normalizeProjects, normalizeSpeckleModels,
  normalizeSpeckleProjects, normalizeSpeckleServer, normalizeSpeckleUser, normalizeSpeckleVersions, normalizeTopFolders, parseApsToken, parseObjectLines,
  propertyKeys, shortType, speckleObjectsUrl,
} from "./connectors";

// Fixtures shaped like the documented responses (APS Data Management OpenAPI spec, Speckle GraphQL schema).

const HUBS = {
  jsonapi: { version: "1.0" }, links: { self: { href: "https://developer.api.autodesk.com/project/v1/hubs" } },
  data: [
    { type: "hubs", id: "b.c8b0c73d-3ae9", attributes: { name: "Contoso ACC", extension: { type: "hubs:autodesk.bim360:Account", version: "1.0" }, region: "EMEA" }, links: { self: { href: "x" } } },
    { type: "hubs", id: "a.cGVyc29uYWw", attributes: { name: "My personal hub", extension: { type: "hubs:autodesk.a360:PersonalHub", version: "1.0" }, region: "US" }, links: { self: { href: "x" } } },
  ],
};

const PROJECTS = {
  links: { self: { href: "x" }, next: { href: "https://developer.api.autodesk.com/project/v1/hubs/b.1/projects?page%5Bnumber%5D=1" } },
  data: [{ type: "projects", id: "b.proj-1", attributes: { name: "Hospital Phase 1", scopes: [], extension: { type: "projects:autodesk.bim360:Project" } } }],
};

const TOP = {
  data: [
    { type: "folders", id: "urn:adsk.wipprod:fs.folder:co.pf", attributes: { name: "Project Files", displayName: "Project Files", objectCount: 4, hidden: false, lastModifiedTime: "2026-10-01T10:00:00.000Z", extension: { type: "folders:autodesk.bim360:Folder" } } },
    { type: "folders", id: "urn:adsk.wipprod:fs.folder:co.hidden", attributes: { name: "checklist_x", displayName: "checklist_x", hidden: true, extension: {} } },
  ],
};

const CONTENTS = {
  links: { self: { href: "x" }, next: { href: "https://evil.example.com/steal" } },
  data: [
    { type: "folders", id: "urn:f:arch", attributes: { name: "Architecture", displayName: "Architecture", objectCount: 12, lastModifiedTime: "2026-09-30T08:00:00.000Z", lastModifiedUserName: "A. Engineer", hidden: false } },
    { type: "items", id: "urn:adsk.wipprod:dm.lineage:abc", attributes: { displayName: "", lastModifiedTime: "2026-10-02T09:00:00.000Z", hidden: false, extension: { type: "items:autodesk.bim360:File" } },
      relationships: { tip: { data: { type: "versions", id: "urn:adsk.wipprod:fs.file:vf.abc?version=3" } } } },
    { type: "items", id: "urn:adsk.wipprod:dm.lineage:del", attributes: { displayName: "deleted.pdf", hidden: true }, relationships: { tip: { data: { type: "versions", id: "v-del" } } } },
  ],
  included: [
    { type: "versions", id: "urn:adsk.wipprod:fs.file:vf.abc?version=3", attributes: { name: "HOS01-ABC-ZZ-01-DR-A-0001.pdf", displayName: "HOS01-ABC-ZZ-01-DR-A-0001.pdf", versionNumber: 3, fileType: "pdf", storageSize: 102400,
      lastModifiedTime: "2026-10-03T12:00:00.000Z", lastModifiedUserName: "B. Architect", extension: { type: "versions:autodesk.bim360:File" } } },
  ],
};

describe("APS URL and token helpers", () => {
  it("builds the v2 authorize URL", () => {
    const u = new URL(apsAuthorizeUrl({ clientId: "cid", redirectUri: "http://localhost:5173/api/aps/callback", state: "s1" }));
    expect(u.origin + u.pathname).toBe("https://developer.api.autodesk.com/authentication/v2/authorize");
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("redirect_uri")).toBe("http://localhost:5173/api/aps/callback");
    expect(u.searchParams.get("scope")).toBe("data:read user-profile:read");
    expect(u.searchParams.get("state")).toBe("s1");
  });
  it("builds Basic auth and form bodies", () => {
    expect(apsBasicAuth("id", "secret")).toBe(`Basic ${Buffer.from("id:secret").toString("base64")}`);
    const a = new URLSearchParams(apsTokenBody({ grant: "authorization_code", code: "c", redirectUri: "http://x/cb" }));
    expect([a.get("grant_type"), a.get("code"), a.get("redirect_uri")]).toEqual(["authorization_code", "c", "http://x/cb"]);
    const b = new URLSearchParams(apsTokenBody({ grant: "refresh_token", refreshToken: "r" }));
    expect([b.get("grant_type"), b.get("refresh_token"), b.get("scope")]).toEqual(["refresh_token", "r", "data:read user-profile:read"]);
  });
  it("parses token responses with an expiry margin", () => {
    expect(parseApsToken({ access_token: "a", refresh_token: "r", expires_in: 3599, token_type: "Bearer" }, 1000)).toEqual({ accessToken: "a", refreshToken: "r", expiresAt: 1000 + 3539 * 1000 });
    expect(parseApsToken({ error: "invalid_grant" })).toBeNull();
  });
  it("builds Data Management URLs with encoded ids and pagination", () => {
    expect(apsProjectsUrl("b.1")).toBe("https://developer.api.autodesk.com/project/v1/hubs/b.1/projects?page%5Bnumber%5D=0&page%5Blimit%5D=200");
    expect(apsTopFoldersUrl("b.1", "b.2")).toBe("https://developer.api.autodesk.com/project/v1/hubs/b.1/projects/b.2/topFolders");
    expect(apsFolderContentsUrl("b.2", "urn:adsk.wipprod:fs.folder:co.x")).toBe("https://developer.api.autodesk.com/data/v1/projects/b.2/folders/urn%3Aadsk.wipprod%3Afs.folder%3Aco.x/contents?page%5Bnumber%5D=0&page%5Blimit%5D=200");
  });
  it("follows next links only on the APS host", () => {
    expect(apsNextHref(PROJECTS)).toContain("page%5Bnumber%5D=1");
    expect(apsNextHref(CONTENTS)).toBeUndefined();
    expect(apsNextHref({})).toBeUndefined();
  });
});

describe("APS normalisers", () => {
  it("normalises hubs and projects", () => {
    expect(normalizeHubs(HUBS)).toEqual([
      { id: "b.c8b0c73d-3ae9", name: "Contoso ACC", kind: "ACC / BIM 360", region: "EMEA" },
      { id: "a.cGVyc29uYWw", name: "My personal hub", kind: "Personal", region: "US" },
    ]);
    expect(normalizeProjects(PROJECTS)).toEqual([{ id: "b.proj-1", name: "Hospital Phase 1", kind: "ACC / BIM 360" }]);
    expect(normalizeHubs(null)).toEqual([]);
  });
  it("drops hidden top folders", () => {
    const f = normalizeTopFolders(TOP);
    expect(f.map((x) => x.name)).toEqual(["Project Files"]);
    expect(f[0].objectCount).toBe(4);
  });
  it("joins items to their tip version and uses the version file name", () => {
    const c = normalizeFolderContents(CONTENTS);
    expect(c.folders).toEqual([{ id: "urn:f:arch", name: "Architecture", modified: "2026-09-30T08:00:00.000Z", modifiedBy: "A. Engineer", objectCount: 12 }]);
    expect(c.files).toEqual([{ id: "urn:adsk.wipprod:dm.lineage:abc", versionId: "urn:adsk.wipprod:fs.file:vf.abc?version=3", name: "HOS01-ABC-ZZ-01-DR-A-0001.pdf", version: 3,
      modified: "2026-10-03T12:00:00.000Z", modifiedBy: "B. Architect", size: 102400, fileType: "pdf" }]);
    expect(mergeContents([c, { folders: [], files: [{ ...c.files[0], id: "2", name: "A.rvt" }] }]).files.map((f) => f.name)).toEqual(["A.rvt", "HOS01-ABC-ZZ-01-DR-A-0001.pdf"]);
  });
  it("normalises the OIDC user", () => {
    expect(normalizeApsUser({ sub: "X", name: "Jane Doe", email: "j@x.com" })).toEqual({ name: "Jane Doe", email: "j@x.com" });
    expect(normalizeApsUser({ given_name: "Jane", family_name: "Doe" }).name).toBe("Jane Doe");
  });
});

describe("Speckle helpers", () => {
  it("normalises server addresses", () => {
    expect(normalizeSpeckleServer("")).toBe("https://app.speckle.systems");
    expect(normalizeSpeckleServer("speckle.example.com/projects/x")).toBe("https://speckle.example.com");
    expect(normalizeSpeckleServer("http://speckle.example.com")).toBe("");
    expect(normalizeSpeckleServer("http://localhost:3000")).toBe("http://localhost:3000");
    expect(normalizeSpeckleServer("https://user:pw@host.com")).toBe("");
    expect(speckleObjectsUrl("https://s", "p1", "o1")).toBe("https://s/objects/p1/o1");
  });
  it("only relays read-only GraphQL", () => {
    expect(isReadOnlyGraphql("query X { activeUser { id } }")).toBe(true);
    expect(isReadOnlyGraphql("{ serverInfo { name } }")).toBe(true);
    expect(isReadOnlyGraphql("mutation { tokenDelete(token: \"x\") }")).toBe(false);
    expect(isReadOnlyGraphql("query { a } mutation { b }")).toBe(false);
  });
  it("normalises users, projects, models and versions", () => {
    expect(normalizeSpeckleUser({ data: { activeUser: { id: "u1", name: "Sam", email: "s@x" } } })).toEqual({ id: "u1", name: "Sam", email: "s@x" });
    expect(normalizeSpeckleUser({ data: { activeUser: null } })).toBeNull();
    const p = normalizeSpeckleProjects({ data: { activeUser: { id: "u1", projects: { totalCount: 2, cursor: "c1", items: [{ id: "p1", name: "Tower", updatedAt: "2026-10-01T00:00:00Z" }] } } } });
    expect(p).toEqual({ totalCount: 2, cursor: "c1", items: [{ id: "p1", name: "Tower", updatedAt: "2026-10-01T00:00:00Z" }] });
    const m = normalizeSpeckleModels({ data: { project: { id: "p1", models: { totalCount: 1, cursor: null, items: [{ id: "m1", name: "architecture/level 1", displayName: "level 1", updatedAt: "" }] } } } });
    expect(m.items[0]).toEqual({ id: "m1", name: "architecture/level 1", updatedAt: "" });
    expect(m.cursor).toBeNull();
    const v = normalizeSpeckleVersions({ data: { project: { id: "p1", model: { id: "m1", name: "x", versions: { totalCount: 2, cursor: null, items: [
      { id: "v1", message: "Issue S2", sourceApplication: "Revit", createdAt: "2026-10-01", referencedObject: "abc123", totalChildrenCount: 10, authorUser: { name: "Sam" } },
      { id: "v2", message: null, sourceApplication: "Revit", createdAt: "2026-10-02", referencedObject: "bundle.p1.m1.v2", totalChildrenCount: null, authorUser: null },
    ] } } } } });
    expect(v.items.map((x) => [x.id, x.bundle, x.author, x.totalChildrenCount])).toEqual([["v1", false, "Sam", 10], ["v2", true, "", null]]);
    expect(isBundleRef("abc")).toBe(false);
  });
  it("reports GraphQL errors", () => {
    expect(graphqlError({ errors: [{ message: "Your token is not valid" }] })).toBe("Your token is not valid");
    expect(graphqlError({ data: {} })).toBe("");
  });
});

describe("Speckle object statistics", () => {
  const lines = [
    `root\t${JSON.stringify({ id: "root", speckle_type: "Speckle.Core.Models.Collections.Collection", name: "Model" })}`,
    `w1\t${JSON.stringify({ id: "w1", speckle_type: "Objects.BuiltElements.Wall:Objects.BuiltElements.Revit.RevitWall", category: "Walls", properties: { Parameters: { "Fire Rating": "60" } } })}`,
    `w2\t${JSON.stringify({ id: "w2", speckle_type: "Objects.BuiltElements.Wall:Objects.BuiltElements.Revit.RevitWall", category: "Walls", properties: { Parameters: { "Fire Rating": "" } } })}`,
    `d1\t${JSON.stringify({ id: "d1", speckle_type: "Objects.BuiltElements.Revit.FamilyInstance", properties: { category: "Doors" } })}`,
    `c1\t${JSON.stringify({ id: "c1", speckle_type: "Speckle.Core.Models.DataChunk", data: [1, 2, 3] })}`,
    `bad\t{not json`,
  ].join("\n");

  it("parses text/plain lines with a limit", () => {
    expect(parseObjectLines(lines).objects).toHaveLength(5);
    const lim = parseObjectLines(lines, 2);
    expect(lim.objects.map((o) => o.id)).toEqual(["root", "w1"]);
    expect(lim.truncated).toBe(true);
    expect(parseObjectLines(lines).truncated).toBe(false);
  });
  it("counts elements by type and category", () => {
    const els = parseObjectLines(lines).objects.filter(isElement);
    expect(els.map((o) => o.id)).toEqual(["w1", "w2", "d1"]);
    expect(countBy(els, (o) => shortType(String(o.speckle_type)))).toEqual([{ key: "RevitWall", count: 2 }, { key: "FamilyInstance", count: 1 }]);
    expect(countBy(els, categoryOf)).toEqual([{ key: "Walls", count: 2 }, { key: "Doors", count: 1 }]);
  });
  it("lists property paths and measures completeness", () => {
    const els = parseObjectLines(lines).objects.filter(isElement);
    const keys = propertyKeys(els);
    expect(keys).toContain("properties.Parameters.Fire Rating");
    expect(keys).toContain("category");
    expect(keys).not.toContain("id");
    const c = completeness(els, "properties.Parameters.Fire Rating");
    expect([c.total, c.filled, c.percent]).toEqual([3, 1, 33.3]);
    expect(c.byType[0]).toEqual({ key: "RevitWall", total: 2, filled: 1, percent: 50 });
    expect(completeness([], "x").percent).toBe(0);
  });
});
