const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', ({ userId, role }) => {
        socket.data = { ...socket.data, userId, role };
        socket.join(userId); // Join personal room for targeted DMs
        console.log(`User registered: ${userId} [${role}]`);
    });

    socket.on('offer', ({ offer, targetId }) => {
        if (socket.data?.role !== 'teacher') {
            console.log(`Blocked offer attempt from non-teacher socket: ${socket.id}`);
            return;
        }
        console.log(`[CALL] offer forwarded to ${targetId}`);
        socket.to(targetId).emit('incoming-call', { offer, callerId: socket.data.userId });
    });

    socket.on('answer', ({ answer, targetId }) => {
        console.log(`[CALL] answer forwarded to ${targetId}`);
        socket.to(targetId).emit('answer', answer);
    });

    socket.on('ice-candidate', ({ candidate, targetId }) => {
        console.log(`[CALL] ice-candidate forwarded to ${targetId}`);
        socket.to(targetId).emit('ice-candidate', candidate);
    });

    socket.on('end-call', ({ targetId }) => {
        console.log(`[CALL] end-call forwarded to ${targetId}`);
        socket.to(targetId).emit('call-ended');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id, socket.data.userId);
    });
});

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
