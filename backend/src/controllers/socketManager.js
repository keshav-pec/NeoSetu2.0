const { Server } = require("socket.io");

let connections = {};
let messages = {};
let timeOnline = {};

exports.connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://neosetu.vercel.app',
        'https://neosetu-b.vercel.app',
        'https://neosetu-qcv5.onrender.com'
      ],
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true 
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ New socket connection: ${socket.id}`);

    socket.on("join-call", (path) => {
      console.log(`🔗 Socket ${socket.id} joining call: ${path}`);
      
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      // Get existing clients before adding new one
      const existingClients = [...connections[path]];
      
      // Add new client to room
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Send existing clients to the new joiner (so they can initiate offers)
      if (existingClients.length > 0) {
        console.log(`📤 Sending existing clients to new user ${socket.id}:`, existingClients);
        io.to(socket.id).emit("user-joined", socket.id, existingClients);
      }

      // Notify all existing clients about the new user
      existingClients.forEach((clientId) => {
        console.log(`📢 Notifying ${clientId} about new user ${socket.id}`);
        io.to(clientId).emit("user-joined", socket.id, [socket.id]);
      });

      // Send previous chat messages to new joiner only
      if (messages[path] !== undefined && messages[path].length > 0) {
        console.log(`💬 Sending ${messages[path].length} previous messages to ${socket.id}`);
        messages[path].forEach((el) => {
          io.to(socket.id).emit(
            "chat-message",
            el["data"],
            el["sender"],
            el["socket-id-sender"]
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      console.log(`🔄 Relaying signal from ${socket.id} to ${toId}`);
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      console.log(`💬 Chat message from ${socket.id} (${sender}): ${data.substring(0, 50)}...`);
      
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];
        },
        ["", false]
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        // Store message for history
        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        // Broadcast to all clients in the room (including sender for confirmation)
        console.log(`📤 Broadcasting message to ${connections[matchingRoom].length} clients in room`);
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      } else {
        console.log(`⚠️ Socket ${socket.id} not found in any room`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());
      var key;

      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;
            console.log(`🔍 Found ${socket.id} in room: ${key}`);

            // Notify all other clients in the room
            for (let a = 0; a < connections[key].length; ++a) {
              if (connections[key][a] !== socket.id) {
                console.log(`📢 Notifying ${connections[key][a]} that ${socket.id} left`);
                io.to(connections[key][a]).emit("user-left", socket.id);
              }
            }

            // Remove from room
            var index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);

            // Clean up empty rooms
            if (connections[key].length === 0) {
              console.log(`🧹 Cleaning up empty room: ${key}`);
              delete connections[key];
              delete messages[key];
            }
          }
        }
      }
      
      // Clean up time tracking
      delete timeOnline[socket.id];
    });
  });
  return io;
};
