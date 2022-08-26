import { execSync } from "child_process";
import fsExtra from "fs-extra";
import { log, error } from "../../util/log";
import { ExportPreviewsArgs, handler } from "../exportPreviews";

jest.mock("../../util/log");

describe("exportPreviews command", () => {
  it("outputs html files to outDir", async () => {
    await handler({
      outDir: "./out",
      emailsDir: "./emails",
    } as ExportPreviewsArgs);
    expect(error).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("Exporting preview html to");
    expect(log).toHaveBeenCalledWith("✅ Processed 4 previews");
  });

  it("errors without emails dir", async () => {
    jest
      .spyOn(fsExtra, "existsSync")
      .mockImplementation((path) => /package\.json/.test(path.toString()));
    await handler({
      outDir: "./out",
      emailsDir: "./NoTaDiReCtOrY",
    } as ExportPreviewsArgs);
    expect(error).toHaveBeenCalledWith(
      "Could not find emails directory. Have you initialized the project with `mailing init`?"
    );
  });

  describe("e2e", () => {
    it("runs on templates", () => {
      const out = execSync(
        __dirname + "/../../dev.js export-previews"
      ).toString();
      expect(out).toMatchSnapshot();
    });
  });
});
