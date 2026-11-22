const { TikTokLiveConnection, WebcastEvent } = require('tiktok-live-connector');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.json());
let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/config', (req, res) => res.json(config));

app.post('/save-config', (req, res) => {
    config = req.body;
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
    res.sendStatus(200);
});

const connection = new TikTokLiveConnection(config.tiktokUsername, {});
connection.connect();

connection.on(WebcastEvent.GIFT, data => {
    if ((data.repeatEnd || !data.repeatable) && config.gifts[data.giftName]) {
        io.emit('addTime', config.gifts[data.giftName].time);
    }
});

connection.on(WebcastEvent.LIKE, data => {
    io.emit('likeUpdate', { count: data.likeCount, limit: config.likesForWheel });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Сервер запущен на порту ' + PORT);
});
