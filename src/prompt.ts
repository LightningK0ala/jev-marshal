export async function readSecret(prompt: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Set TYPESAFE_API_KEY in this environment.");
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(value);
    };
    const onData = (key: string) => {
      if (key === "\r" || key === "\n") return finish();
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdout.write("\n");
        reject(new Error("Cancelled."));
        return;
      }
      if (key === "\u007f") {
        if (value) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      value += key;
      process.stdout.write("*");
    };
    process.stdin.on("data", onData);
  });
}
