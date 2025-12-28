//import { Chess } from "chess.js";
const {Chess} = require("chess.js")

 class Game {
    constructor(white, black, roomId,whiteid , blackid,manager) {
        this.white = white;
        this.black = black;
        this.roomId = roomId;
        this.whiteid = whiteid
        this.blackid = blackid
        this.chess = new Chess();
        this.manager= manager
        this.movecount = 0;
        this.lastmove = null // this is used to store the previous move ,i mean the move made
        this.movelist = []
        const payload = {
            type: "start_game",
            roomId,
        fen: this.chess.fen()
        };
        this.checkcolour = null

        this.white.send(JSON.stringify({ ...payload, color: "white" }));
        this.black.send(JSON.stringify({ ...payload, color: "black" }));
    }

    handleMove(socket, { from, to }) {
        // enforce turn order
        if (this.movecount % 2 === 0 && socket !== this.white) return;
        if (this.movecount % 2 === 1 && socket !== this.black) return;
        let move
        try {
              move = this.chess.move({ from, to, promotion: "q" });
        } catch (error) {
            socket.send(JSON.stringify(
                {
                    type:"error"
                    ,message:"hey this is invalid structure"
                }
            ))
        }

       

        if (!move) {
            socket.send(JSON.stringify({from, to, message: "invalid move" }));
            return;
        }

        this.movecount++;


        const update = {
            fen: this.chess.fen(),
            move,
            turn: this.chess.turn(),
            movelist:this.movelist
        };
        this.lastmove = move
        this.movelist.push(move.san)
        this.checkcolour = this.chess.inCheck()
        // send to everyone else (opponent + spectators)
        this.white.send(JSON.stringify({check:this.chess.isCheck(),type:"move_made",message:"you just made a move", ...update}));

        // send to the player who moved
         this.black.send(JSON.stringify({check:this.chess.isCheck(),type:"move_made",message:"you just made a move", ...update}));

        // GAME OVER LOGIC
        if (this.chess.isGameOver()) {
            if (this.chess.isCheckmate()) {
                const loser = this.chess.turn();
                const winner = loser === "w" ? "black" : "white";

                this.white.send(JSON.stringify( { type:"game_over", reason: "checkmate", winner }));
                this.black.send(JSON.stringify({ type:"game_over", reason: "checkmate", winner }) );
                this.manager.endGame(this.roomId)
            } else {
                this.white.send(JSON.stringify({ type:"gamedraw",reason: "draw" }) );
                this.black.send(JSON.stringify({ type:"gamedraw",reason: "draw" }) );
                this.manager.endGame(this.roomId)
            }
        }
    }
}
module.exports = {Game}
