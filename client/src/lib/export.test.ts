import { describe, expect, it } from "vitest";
import { parseTabular } from "./export";

describe("parseTabular", () => {
  it("parses tab-separated rows pasted from Excel", () => expect(parseTabular("a\tb\r\nc\td\r\n")).toEqual([["a", "b"], ["c", "d"]]));
  it("parses CSV with quoted commas and quotes", () => expect(parseTabular('x,"y, z","say ""hi"""\n1,2,3')).toEqual([["x", "y, z", 'say "hi"'], ["1", "2", "3"]]));
  it("keeps empty cells", () => expect(parseTabular("a,,c")).toEqual([["a", "", "c"]]));
  it("keeps newlines inside quoted cells", () => expect(parseTabular('"line1\nline2",b')).toEqual([["line1\nline2", "b"]]));
});
