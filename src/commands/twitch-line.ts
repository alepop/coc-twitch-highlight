import { Neovim, WorkspaceConfiguration } from "coc.nvim";
import { SignCache } from "../types";

export class TwitchLine {
  private signCache: SignCache = new Map();
  private currentFile: string = "";
  private commentHi: string;
  private prefix: string;
  constructor(
    private nvim: Neovim,
    private srcId: number,
    private config: WorkspaceConfiguration
  ) {
    this.commentHi = this.config.get<string>("commentHi") as string;
    this.prefix = this.config.get<string>("commentPrefix") as string;
  }

  private addSign(line: number): void {
    const cmd = `exe ":sign place ${line} line=${line} name=TwitchSign file=" . expand("%:p")`;
    this.nvim.command(cmd, true);
  }

  private async removeSign(line: number): Promise<void> {
    const cmd = `silent! sign unplace ${line}`;
    const buffer = await this.nvim.buffer;
    await this.nvim.command(cmd);
    await buffer.request("nvim_buf_clear_namespace", [this.srcId, 0, -1]);
  }

  public showMessage = async (): Promise<void> => {
    const buffer = await this.nvim.buffer;
    const currentLine = (await this.nvim.call("line", ["."])) as number;
    await buffer.request("nvim_buf_clear_namespace", [this.srcId, 0, -1]);

    if (!this.signCache.has(currentLine)) return;
    if (this.signCache.get(currentLine)?.file !== this.currentFile) return;

    await buffer.setVirtualText(this.srcId, currentLine - 1, [
      [
        (this.prefix + this.signCache.get(currentLine)?.message) as string,
        this.commentHi,
      ],
    ]);
  };

  public setCurrentFile = async (): Promise<void> => {
    const buffer = await this.nvim.buffer;
    const name = await buffer.name;
    this.currentFile = name;
  };

  public create(line: number, message: string): void {
    this.addSign(line);
    this.signCache.set(line, { file: this.currentFile, message });
  }

  public remove = async (): Promise<void> => {
    const currentLine = (await this.nvim.call("line", ["."])) as number;
    this.removeSign(currentLine);
    this.signCache.delete(currentLine);
  };

  public removeAll = async (): Promise<void> => {
    this.signCache.forEach(async (_, key) => {
      await this.removeSign(key);
    });
    this.signCache.clear();
  };
}
