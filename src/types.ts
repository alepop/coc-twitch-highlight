export type SignCache = Map<number, Record<"file" | "message", string>>;

export type CallBacks = Record<
  "message" | "close" | "connected" | "join",
  Function
>;
