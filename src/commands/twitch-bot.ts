import { workspace, WorkspaceConfiguration } from "coc.nvim";
import { CallBacks } from "../types";
import Bot from "twitch-bot";

export class TwitchBot {
  private bot: any;
  private callbacks: CallBacks = {} as any;
  constructor(private config: WorkspaceConfiguration) {}

  public start = () => {
    const username = this.config.get<string>(
      "bot.username",
      process.env.COC_TWITCH_USERNAME as string
    );
    const oauth = this.config.get<string>(
      "bot.oauth",
      process.env.COC_TWITCH_OAUTH as string
    );
    const channel = this.config.get<string>("bot.channel");

    try {
      this.bot = new Bot({ oauth, username, channels: [channel] });
      this.initCallbacks();
    } catch (e) {
      workspace.showMessage(
        "You should provide connection settings for coc-twitch-highlight extension!",
        "error"
      );
    }
  };

  public stop = () => this.bot.close();

  public setCallbackFor(name: keyof CallBacks, callback: Function): void {
    this.callbacks[name] = callback;
  }

  private initCallbacks(): void {
    for (let event in this.callbacks) {
      this.bot.on(event, this.callbacks[event]);
    }
  }
}
