const http = require('http');
const fs = require('fs');

const { Player } = require('./game/class/player');
const { World } = require('./game/class/world');

const worldData = require('./game/data/basic-world-data');
const { url } = require('inspector');

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

    if (!player){
      res.statusCode = 302;
      res.setHeader("Location",`/`)
      res.end()
      return 
    }
    // Phase 3: GET /rooms/:roomId

    if (req.method === "GET" && req.url.startsWith("/rooms/")){
      const urlParts = req.url.split("/");
      if( urlParts.length === 3 ){
        const roomId = urlParts[2];
        const room = world.rooms[roomId];
        if(room != player.currentRoom){
          res.statusCode = 302;
          res.setHeader("Location", `/rooms/${player.currentRoom.id}`)
          res.end()
          return
        }
        const htmlTemplate = fs.readFileSync("./views/room.html",'utf-8');
        const htmlPage = htmlTemplate
        .replace(/#{roomName}/g, room.name)
        .replace(/#{inventory}/g, player.inventoryToString())
        .replace(/#{roomItems}/g, room.itemsToString())
        .replace(/#{exits}/g, room.exitsToString());

        const resBody = htmlPage;
        res.statusCode = 200;
        res.setHeader("Location", 'text/html');
        res.write(resBody)
        return res.end();
      }
      // Phase 4: GET /rooms/:roomId/:direction
      if (urlParts.length === 4){
        const roomId = urlParts[2];
        const room = world.rooms[roomId];
        if(room != player.currentRoom){
          res.statusCode = 302;
          res.setHeader("Location", `/rooms/${player.currentRoom.id}`)
          res.end()
          return
        }
        const direction = urlParts[3][0].toLowerCase();
        try{
          player.move(direction)
          res.statusCode = 302;
          res.setHeader("Location", `/rooms/${player.currentRoom.id}`)
          res.end()
          return
        } catch (error){
          // console.error(error)
          res.statusCode = 302;
          res.setHeader("Location", `/rooms/${player.currentRoom.id}`);
          res.end()
          return
        }

      }

      res.statusCode = 404;
      return res.end()
    }

    

    // Phase 5: POST /items/:itemId/:action
    // Create a route handler for POST /items/:itemId/:action.

    if (req.method === "POST" && req.url.startsWith("/items/")){
      const urlParts = req.url.split("/");
      if(urlParts.length === 4){
      // Obtain the current itemId and player action by parsing the URL.
        const itemId = urlParts[2];
        const action = urlParts[3];
        res.setHeader("Location", `/rooms/${player.currentRoom.id}`)
        res.statusCode = 302;
        switch(action){
          case 'eat':
            player.eatItem(itemId);
            res.end();
            return
          case 'drop':
            player.dropItem(itemId);
            res.end();
            return
          case 'take':
            player.takeItem(itemId);
            res.end();
            return
          default:
            console.log('invalid actions')
        }
        return
      }
    }


    // Phase 6: Redirect if no matching route handlers
  })
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));