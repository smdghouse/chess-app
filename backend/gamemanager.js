//import {nanoid} from "nanoid"
const { nanoid } = require("nanoid")
//import { Game } from "./game.js"
const { Game } = require("./game.js")
const jwt = require("jsonwebtoken")
const { WebSocketServer } = require("ws")
class GameManager {
    constructor(io) {
        this.io = io
        this.games = new Map()
        this.waiting = null
        this.users = []
    }
    handlePlayer(socket) {
        this.users.push(socket)
        this.handler(socket)
    }
    handler(socket) {
        let msg;
        socket.on("message", data => {
            try {
                msg = JSON.parse(data.toString())
            } catch (error) {
                console.log(`hey client sent the invalid json ${data.toString()}`)
                return
            }
            if(msg.type === "identify")
            {
                console.log("handling identify")
                this.handleIdentify(socket,msg.token)
                return
            }
            if (msg.type === 'resign') {
                this.handleResign(socket)
                return
            }

            if (msg.type === "play_game") {
                if(!socket.playerid)
                {
                    socket.send(JSON.stringify(
                        {
                            type:"error"
                            ,message:"Not authenticated(socket.playerid not found )"

                        }
                    ))
                    return
                }
                this.addPlayer(socket)
                if (!this.waiting)
                    socket.send(JSON.stringify({ type: "start_msg", message: "hey wait for your opponent " }))
            }
            else if (msg.event === "make_move") {
                this.makingMove(socket, msg.move)
            }
            else {
                socket.send(JSON.stringify({ message: "you have send the invalid request " }))
            }
        })
    } addPlayer(socket) {
        if (!this.waiting) {
            this.waiting = socket
            socket.send(JSON.stringify({ type: "waiting", message: "waiting for opponent" }))
            return
        }
        const roomid = nanoid(6)
        const white = this.waiting
        const black = socket
        this.waiting = null
        const game = new Game(white, black, roomid, white.playerid, black.playerid, this)
        this.games.set(roomid, game)
    }
    makingMove(socket, move) {
        for (const [roomId, game] of this.games.entries()) {
            if (game.white === socket || game.black === socket) {
                game.handleMove(socket, move)
                return
            }
        }
    }

    handleDisconnect(socket) {
        if (this.waiting === socket) this.waiting = null;
        for (const [roomid, game] of this.games.entries()) {
            if (game.white === socket || game.black === socket) {
                const opponent = game.black === socket ? game.white : game.black
                opponent.send(JSON.stringify({ message: "sorry to inform you that your opponent has left the world " }))
                this.games.delete(roomid)
            }
        }
    }
    endGame(roomid) {
        if (!this.games.has(roomid)) return
        this.games.delete(roomid)
        console.log("this game_room is over ", roomid)
    }
    handleIdentify(socket, token) {
        try {
            const { userid } = jwt.verify(token, process.env.JWT_SECRET)
            console.log("hey this is userid",userid)
            socket.playerid = userid
            console.log("hey this is socket.id",socket.playerid)
        } catch (error) {
            socket.send(JSON.stringify({ type: "error", message: error }))
        }
        for (const game of this.games.values()) {
            if (socket.playerid === game.whiteid || socket.playerid === game.blackid) {
                const color = socket.playerid === game.whiteid ? "white" : "black"
            
            if (color === "white") {
                game.white = socket
            }
            else
                game.black = socket
            socket.send(JSON.stringify({
                type: "reconnected",
                fen: game.chess.fen(),
                color,
                turn: game.chess.turn(),
                lastmove:game.lastmove,
                movelist: game.movelist,
                isCheck:game.checkcolour
            
            }))
            return
        }}
        socket.send(JSON.stringify(
            {
                type:"not_active_game"
            }
        ))
        return
    }
    handleResign(socket) {
        for (const [roomId, game] of this.games.entries()) {

            // match by PLAYER ID (not socket)
            const isWhite = game.whiteid === socket.playerid;
            const isBlack = game.blackid === socket.playerid;
            console.log("iam upto here ")

            if (!isWhite && !isBlack) continue;

            // decide winner
            const winner = isWhite ? "white" : "black";
            console.log("babu winner is ", winner)

            // notify players (only if socket exists)
            if (game.white) {
                game.white.send(JSON.stringify({
                    type: "game_over",
                    reason: "resign",
                    winner
                }));
            }

            if (game.black) {
                game.black.send(JSON.stringify({
                    type: "game_over",
                    reason: "resign",
                    winner
                }));
            }

            // cleanup
            this.games.delete(roomId);
            console.log("Game ended by resign:", roomId);

            return; // 🔑 IMPORTANT
        }
    }

}
module.exports = { GameManager }