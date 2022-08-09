import { existsSync } from "fs-extra";
import prompts from "prompts";
import { ArgumentsCamelCase } from "yargs";
import { error, log } from "../log";
import {
  getExistingEmailsDir,
  getPackageJSON,
  getMailingAPIBaseURL,
} from "../paths";
import { generateEmailsDirectory } from "../generators";
import { handler as previewHandler } from "./preview";

export type CliArguments = ArgumentsCamelCase<{
  port?: number;
  "emails-dir"?: "./emails" | "./src/emails";
}>;

function looksLikeTypescriptProject(): boolean {
  if (existsSync("./tsconfig.json")) {
    return true;
  }

  const pkg = getPackageJSON();
  return !!(pkg.devDependencies?.typescript || pkg.dependencies?.typescript);
}

export const command = ["$0", "init"];

export const describe = "initialize mailing in your app";

export const builder = {
  typescript: {
    description: "use Typescript",
  },
  "emails-dir": {
    description:
      "where to put your emails - ./emails or ./src/emails are currently the only valid options",
  },
};

export const handler = async (args: CliArguments) => {
  // check if emails directory already exists
  if (!existsSync("./package.json")) {
    log("No package.json found. Please run from the project root.");
    return;
  }

  if (!getExistingEmailsDir()) {
    // options: assign isTypescript
    let isTypescript;
    if ("false" === args.typescript) {
      isTypescript = false;
    } else if (args.typescript) {
      isTypescript = true;
    } else {
      const ts = await prompts({
        type: "confirm",
        name: "value",
        message: "Are you using typescript?",
        initial: looksLikeTypescriptProject(),
      });
      isTypescript = ts.value;
    }

    const options = {
      isTypescript: isTypescript,
      emailsDir: args["emails-dir"],
    };
    await generateEmailsDirectory(options);

    const emailResponse = await prompts({
      type: "text",
      name: "email",
      message:
        "Enter your email for occasional updates about mailing (optional)",
    });
    const { email } = emailResponse;
    if (email?.length > 0) {
      log("Great, talk soon.");
      try {
        log(`${getMailingAPIBaseURL()}/api/users`, {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        await fetch(`${getMailingAPIBaseURL()}/api/users`, {
          method: "POST",
          body: JSON.stringify({ email }),
        });
      } catch (e) {
        error(e);
      }
    } else {
      log("OK, no problem!");
    }
  }

  await previewHandler(args);
};
