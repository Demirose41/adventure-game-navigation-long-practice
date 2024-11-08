const http = require('http');
const fs = require('fs');

const { Player } = require('./game/class/player');
const { World } = require('./game/class/world');

const worldData = require('./game/data/basic-world-data');

let player;
let world = new World();
world.loadWorld(worldData);

const server = http.createServer((req, res) => {

  /* ============== ASSEMBLE THE REQUEST BODY AS A STRING =============== */
  let reqBody = '';
  req.on('data', (data) => {
    reqBody += data;
  });

  req.on('end', () => { // After the assembly of the request body is finished
    /* ==================== PARSE THE REQUEST BODY ====================== */
    if (reqBody) {
      req.body = reqBody
        .split("&")
        .map((keyValuePair) => keyValuePair.split("="))
        .map(([key, value]) => [key, value.replace(/\+/g, " ")])
        .map(([key, value]) => [key, decodeURIComponent(value)])
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    }

    /* ======================== ROUTE HANDLERS ========================== */
    // Phase 1: GET /
    if (req.method === "GET" && req.url === "/"){
      const htmlTemplate = fs.readFileSync("./views/new-player.html", "utf-8");
      const htmlPage = htmlTemplate
      .replace(/#{availableRooms}/g, world.availableRoomsToString())
      const resBody = htmlPage;
      res.statusCode = 200;
      res.setHeader("Content-Type","text/html")
      res.write(resBody);
      return res.end();
    }

    // Phase 2: POST /player

    if (req.method === "POST" && req.url ==="/player"){
      const playerName = req.body.name;
      const startingRoom = world.rooms[req.body.roomId]
      player = new Player(playerName, startingRoom )
      res.statusCode = 302;
      res.setHeader("Location", `/rooms/${startingRoom.id}`)
      res.end();
    }

    // Phase 3: GET /rooms/:roomId

    // Phase 4: GET /rooms/:roomId/:direction

    // Phase 5: POST /items/:itemId/:action

    // Phase 6: Redirect if no matching route handlers
  })
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));