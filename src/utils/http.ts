import * as Net from "net";

export const isPortTaken = (port: number) =>
  new Promise<boolean>((resolve, reject) => {
    const tester: any = Net.createServer()
      .once("error", (err: any) =>
        err.code == "EADDRINUSE" ? resolve(false) : reject(err)
      )
      .once("listening", () =>
        tester.once("close", () => resolve(true)).close()
      )
      .listen(port);
  });
