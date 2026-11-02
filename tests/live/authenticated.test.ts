import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { aiEnabled, body, json, Session, userEnabled } from "./http";

describe.skipIf(!userEnabled)("B: authenticated isolated lifecycle", () => {
  const session = new Session();
  const name = `ZZ-SMOKE-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  let projectId = "", folderId = "", fileId = "", documentId = "";
  let projectOwned = false;
  const content = Buffer.from("ZZ-SMOKE deployment round trip\nUTF-8: café\n");
  const projectPath = () => `/api/projects/${projectId}`;

  beforeAll(async () => { await session.login(process.env.TEST_EMAIL!, process.env.TEST_PASSWORD!); });
  afterAll(async () => {
    // Independent cleanup attempts: a file failure must not prevent project/session cleanup.
    // allSettled is only for teardown; every failure is rethrown, never silently swallowed.
    const failures: unknown[] = [];
    async function cleanup(tasks: (() => Promise<unknown>)[]) {
      const results = await Promise.allSettled(tasks.map((task) => task()));
      for (const result of results) if (result.status === "rejected") failures.push(result.reason);
    }
    // Recover response-loss cases using only this run's exact unique name in our own project list.
    if (!projectId && session.cookie) await cleanup([async () => {
      const result = await body(await session.request("/api/projects"));
      const matches = result.projects.filter((p: { name: string; role: string }) => p.name === name && p.role === "owner");
      expect(matches.length).toBeLessThanOrEqual(1);
      projectId = matches[0]?.id || "";
    }]);
    if (projectId) await cleanup([async () => {
      const result = await body(await session.request(projectPath()));
      expect(result.project.name).toBe(name);
      expect(result.role).toBe("owner");
      projectOwned = true;
    }]);
    if (projectId && projectOwned) {
      // Discover uploads even if a failed write did not return its ID. This project belongs only to this run.
      const fileIds = new Set(fileId ? [fileId] : []);
      await cleanup([async () => {
        const result = await body(await session.request(`${projectPath()}/files`));
        for (const file of result.files) fileIds.add(file.id);
      }]);
      await cleanup([
        ...[...fileIds].map((id) => async () => body(await session.request(`${projectPath()}/files/${id}`, { method: "DELETE" }))),
        ...(documentId ? [async () => body(await session.request(`${projectPath()}/documents/${documentId}`, { method: "DELETE" }))] : []),
      ]);
      if (folderId && !failures.length) await cleanup([async () => body(await session.request(`${projectPath()}/folders/${folderId}`, { method: "DELETE" }))]);
      await cleanup([async () => body(await session.request(projectPath(), { method: "DELETE" }))]);
      await cleanup([async () => {
        const projects = await body(await session.request("/api/projects"));
        expect(projects.projects.some((p: { id: string }) => p.id === projectId), "smoke project must be gone").toBe(false);
      }]);
    }
    const oldCookie = session.cookie;
    await cleanup([() => session.logout()]);
    if (oldCookie) await cleanup([async () => {
      session.cookie = oldCookie;
      try {
        await body(await session.request("/api/projects"), 401);
        expect((await body(await session.request("/api/auth/me"))).user).toBeNull();
      } finally { session.cookie = ""; }
    }]);
    if (failures.length) throw new AggregateError(failures, `Cleanup/logout failed for ${name} (project ${projectId}); investigate immediately`);
  });

  test("session identity, profile, project list and plan are readable", async () => {
    const me = await body(await session.request("/api/auth/me"));
    expect(me.user.email.toLowerCase() === process.env.TEST_EMAIL!.toLowerCase()).toBe(true);
    expect(typeof me.user.name).toBe("string");
    expect(me.user).not.toHaveProperty("passwordHash");
    // There is no GET /profile: /auth/me is the profile read API used by the client.
    expect(Array.isArray((await body(await session.request("/api/projects"))).projects)).toBe(true);
    expect(typeof (await body(await session.request("/api/billing"))).plan.id).toBe("string");
  });

  test("create project/folder/file/document and download identical bytes", async () => {
    // Capture IDs before asserting status, so teardown owns every returned resource.
    const created = await session.request("/api/projects", json("POST", { name, code: "SMOKE", standards: ["iso19650"] }));
    const project = await created.json(); projectId = project.id || "";
    expect(created.status).toBe(201); expect(projectId).toBeTruthy();
    const identity = await body(await session.request(projectPath()));
    expect(identity.project.name).toBe(name);
    expect(identity.role).toBe("owner");
    const folder = await session.request(`${projectPath()}/folders`, json("POST", { name }));
    const folderData = await folder.json(); folderId = folderData.id || "";
    expect(folder.status).toBe(201); expect(folderId).toBeTruthy();
    const form = new FormData();
    form.set("folderId", folderId);
    form.set("file", new Blob([content], { type: "text/plain" }), `${name}.txt`);
    const uploaded = await session.request(`${projectPath()}/files`, { method: "POST", body: form });
    const file = await uploaded.json(); fileId = file.id || "";
    expect(uploaded.status).toBe(201); expect(fileId).toBeTruthy();
    const download = await session.request(`${projectPath()}/files/${fileId}/download`);
    expect(download.status).toBe(200);
    expect(Buffer.from(await download.arrayBuffer())).toEqual(content);
    const doc = await session.request(`${projectPath()}/documents`, json("POST", { templateId: "bep-pre", title: name }));
    const document = await doc.json(); documentId = document.id || "";
    expect(doc.status).toBe(201); expect(documentId).toBeTruthy();
    expect((await body(await session.request(`${projectPath()}/documents/${documentId}`))).document.title).toBe(name);
  });

  test.skipIf(!aiEnabled)("D: exactly one tiny paid AI request, no retries", async () => {
    expect(projectId, "lifecycle must create the isolated project first").toBeTruthy();
    const answer = await body(await session.request(`${projectPath()}/assistant`, json("POST", {
      messages: [{ role: "user", content: "Reply with just OK. This is a deployment smoke test." }],
    })));
    expect(typeof answer.answer).toBe("string");
    expect(answer.answer.trim().length).toBeGreaterThan(0);
  });
});
