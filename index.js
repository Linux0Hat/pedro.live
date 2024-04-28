const fs = require("mz/fs");
const path = require("path");
const http = require("http");
const url = require("url");
const { Readable } = require("stream");

// Path to the directory containing the .txt files
const directory = "frames";

let frames = [];

// Utiliser async/await pour charger les frames de manière synchrone
async function loadFrames() {
  try {
    const files = await fs.readdir(directory);

    // Trier les noms de fichiers par ordre alphabétique
    files.sort((a, b) => {
      const numA = parseInt(a.split(".")[0]); // Extraire le numéro du nom de fichier
      const numB = parseInt(b.split(".")[0]);
      return numA - numB;
    });

    for (const file of files) {
      if (file.endsWith(".txt")) {
        const filePath = path.join(directory, file);
        const content = await fs.readFile(filePath, "utf8");
        frames.push(content);
      }
    }
  } catch (err) {
    console.error("Error loading frames:", err);
  }
}

// Appeler la fonction pour charger les frames
loadFrames();

const streamer = (stream) => {
  let index = 0;

  return setInterval(() => {
    // Effacer l'écran
    stream.push("\033[2J\033[3J\033[H");
    stream.push(frames[index]);
    index = (index + 1) % frames.length;
  }, 90);
};

const server = http.createServer((req, res) => {
  if (req.url === "/healthcheck") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (
    req.headers &&
    req.headers["user-agent"] &&
    !req.headers["user-agent"].includes("curl")
  ) {
    res.writeHead(302, { Location: "https://github.com/Linux0Hat/pedro.live" });
    return res.end();
  }

  const stream = new Readable();
  stream._read = function noop() {};
  stream.pipe(res);
  const interval = streamer(stream);

  req.on("close", () => {
    stream.destroy();
    clearInterval(interval);
  });
});

const port = process.env.PARROT_PORT || 3000;
server.listen(port, (err) => {
  if (err) throw err;
  console.log(`Listening on localhost:${port}`);
});
