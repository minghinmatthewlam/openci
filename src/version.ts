declare const __OPENCI_VERSION__: string;

export const CLI_VERSION =
  typeof __OPENCI_VERSION__ !== "undefined" ? __OPENCI_VERSION__ : "0.0.0-dev";
