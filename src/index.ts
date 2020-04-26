import { commands, ExtensionContext, workspace, events } from "coc.nvim";
import { TwitchLine, TwitchBot } from "./commands/index";
const { nvim } = workspace;

export async function activate({
  subscriptions,
}: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration("twitchHighlight");
  const enable = config.get<boolean>("enable", true);
  if (!enable) return;

  const srcId = await nvim.createNamespace("twitchHighlight");
  const sign = config.get<string>("sign");
  const signHi = config.get<string>("signHi");
  const numHi = config.get<string>("numHi");
  const lineHi = config.get<string>("lineHi");

  await nvim.command("hi TwitchBg guibg=#6441a5 guifg=white");
  await nvim.command("hi TwitchFg guifg=#6441a5");
  nvim.command(
    `sign define TwitchSign text=${sign} texthl=${signHi} numhl=${numHi} ${
      lineHi ? "linehl=${lineHi}" : ""
    }`,
    true
  );

  const twitchLine = new TwitchLine(nvim, srcId, config);
  const twitchBot = new TwitchBot(config);

  twitchBot.setCallbackFor("connected", () =>
    workspace.showMessage("Twitch highlight bot connected!")
  );

  twitchBot.setCallbackFor("join", () =>
    workspace.showMessage("Twitch highlight bot joined!")
  );

  twitchBot.setCallbackFor("message", (chatter) => {
    if (chatter.message.startsWith("!line")) {
      const [_, line, ...message] = chatter.message.split(" ");
      const lineMessage = `${chatter.username}: ${message.join(" ")}`;
      const parsedLine = parseInt(line, 10);
      if (isNaN(parsedLine)) return;
      twitchLine.create(parsedLine, lineMessage);
    }
  });

  twitchBot.setCallbackFor("close", () => {
    workspace.showMessage("Twitch highlight bot disconected!");
    twitchLine.removeAll();
  });

  subscriptions.push(
    commands.registerCommand("twitchHighlight.start", twitchBot.start)
  );
  subscriptions.push(
    commands.registerCommand("twitchHighlight.stop", twitchBot.stop)
  );
  subscriptions.push(
    commands.registerCommand("twitchHighlight.remove", twitchLine.remove)
  );
  subscriptions.push(
    commands.registerCommand("twitchHighlight.removeAll", twitchLine.removeAll)
  );

  events.on("CursorHold", twitchLine.showMessage, null, subscriptions);
  events.on("BufEnter", twitchLine.setCurrentFile, null, subscriptions);

  subscriptions.push(
    workspace.registerKeymap(["n"], "twitch-highlight-start", twitchBot.start)
  );

  subscriptions.push(
    workspace.registerKeymap(["n"], "twitch-highlight-stop", twitchBot.stop)
  );

  subscriptions.push(
    workspace.registerKeymap(
      ["n"],
      "twitch-highlight-remove",
      async () => await twitchLine.remove(),
      { sync: false }
    )
  );
  subscriptions.push(
    workspace.registerKeymap(
      ["n"],
      "twitch-highlight-remove-all",
      async () => await twitchLine.removeAll(),
      { sync: false }
    )
  );
}
