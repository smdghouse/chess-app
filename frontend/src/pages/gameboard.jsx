import { useEffect, useState } from "react"
import useSocket from "../hooks/useSocket"
import Chessboard from "../components/Chessboard.jsx"
import { Chess } from "chess.js"
function Gameboard() {
  const [notstarted, setnotstarted] = useState(true)
  const [chess, setChess] = useState(new Chess())
  const [moveList, setMoveList] = useState([])
  const [board, setBoard] = useState(chess.board())
  const [colour, setColour] = useState(null)
  const [king_colour, setKing_colour] = useState('p')
  const [turn, setTurn] = useState("w")
  const [premove, setPremove] = useState({})
  const [gameover, setGameover] = useState(false)
  const [gamemsg, setGamemsg] = useState('')
  const [wait, setWait] = useState(false)
  const handlemessage = (message)=>{
console.log(message)
      switch (message.type) {
        case "not_active_game":
          console.log("game is not active")
          break
        case "reconnected": 
          console.log("hello ma")
          const restored = new Chess(message.fen);

          setChess(restored);
          setBoard(restored.board());

          setMoveList(message.moves || []);
          const lastfrom = message.lastmove.from
          const lastto = message.lastmove.to
          setPremove({prefrom:lastfrom,preto:lastto}); 
          if(message.isCheck)
          {
            setKing_colour(message.turn);  
          }else
          {
            setKing_colour('p');  
          }
                   // optional
          setTurn(message.turn);
          setColour(message.color);

          setGameover(false);
          setGamemsg('');
          setWait(false);
          setnotstarted(false); 

          console.log("Game restored after reconnect");
          break;
        

        case "waiting":
          setWait(true)
          break
        case "game_over":
          setGameover(true)
          if (message.reason === "checkmate")
            setGamemsg(`${message.winner} won `)
          if (message.reason === "resign")
            setGamemsg(`${message.winner} resign`)
          setnotstarted(true)
          break

        case "move_made":

          console.log("hello bachho ")
          const movemade = message.move
          const prefrom = movemade.from
          const preto = movemade.to
          setPremove({ prefrom, preto })
          setChess(prev => {
            const updated = new Chess(prev.fen());

            // Make the move and get SAN
            const result = updated.move(movemade);
            const san = result.san;  // ← This is "e4", "Nf3", "Bb5", "O-O", etc.

            // Store SAN in your moveList
            setMoveList(message.movelist);
            setBoard(updated.board());
            setTurn(message.turn);
            return updated;
          });

          console.log("move has made")
          console.log(chess.inCheck())
          if (message.check) {
            setKing_colour(message.turn)
          }
          else {
            setKing_colour('p')
          }
          break
        case "start_game":
          const fresh = new Chess(message.fen);
          setChess(fresh);
          setBoard(fresh.board());

          setMoveList([]);        // clear moves
          setPremove({});         // clear highlights
          setKing_colour('p');    // no check
          setTurn('w');           // ALWAYS start from white
          setColour(message.color);

          setGameover(false);
          setGamemsg('');

          setWait(false);
          setnotstarted(false);

          console.log("new game started cleanly");
          break
        default:
          break;
      }
  }
   const socket = useSocket(handlemessage)
  if (!socket)
    return <div className="flex min-w-full min-h-screen items-center justify-center"> <h1 className=" text-5xl">
      connecting.....!
    </h1></div>
  return (

    <div className="flex h-screen min-w-full bg-white">

      {/* LEFT PANEL */}
      <div className="flex items-center justify-center bg-slate-600 w-[60%] h-screen">
        <Chessboard turn={turn} kingcolour={king_colour} board={board} socket={socket} chess={chess} premove={premove} colour={colour} />
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[40%] h-screen bg-slate-700 flex flex-col">

        {/* STATUS BAR */}
        <div className="p-4 text-white text-center border-b border-slate-500">
          {wait && <p className="text-yellow-300">Waiting for opponent...</p>}
          {!notstarted && !wait && <p>Game in progress</p>}
          {notstarted && !wait && <p>Ready to start</p>}
        </div>

        {/* MOVES LIST (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 text-white">
          {!notstarted && (
            <h2 className="text-xl mb-4 text-center">Moves</h2>
          )}

          <div className="grid grid-cols-3 gap-y-2 text-center">
            {moveList.map((sanMove, index) => {
              if (index % 2 !== 0) return null;

              return (
                <div key={index} className="contents">
                  <span className="font-semibold">
                    {Math.floor(index / 2) + 1}.
                  </span>
                  <span>{sanMove}</span>
                  <span>{moveList[index + 1] || ""}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIONS (BOTTOM FIXED) */}
        <div className="p-4 border-t border-slate-500 flex flex-col gap-3">

          {/* START GAME */}
          {notstarted && (
            <button
              className={`
          px-4 py-2 rounded-lg transition
          ${wait
                  ? "bg-gray-400 text-gray-700 pointer-events-none"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                }
        `}
              onClick={() => {
                socket.send(JSON.stringify({
                  type: "play_game",
                  token: localStorage.getItem("token"),
                }))
              }}
            >
              {wait ? "Waiting..." : "Start Game"}
            </button>
          )}

          {/* IN-GAME ACTIONS */}
          {!notstarted && !gameover && (
            <div className="flex gap-3 justify-center">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() =>
                  socket.send(JSON.stringify({ type: "resign" }))
                }
              >
                Resign
              </button>
              {// i will implement this draw button later 
              }
              {/* <button
          className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
          onClick={() =>
            socket.send(JSON.stringify({ type: "draw_request" }))
          }
        >
          Draw
        </button> */}
            </div>
          )}

        </div>
      </div>


      {
        // this is for the popup when the game is over 
      }
      {gameover && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white w-80 p-6 rounded-xl text-center relative">

            {/* Close (X) */}
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setGameover(false)}
            >
              ✕
            </button>

            {/* Game Result */}
            <h2 className="text-2xl font-bold mb-4">
              {gamemsg}
            </h2>

            {/* New Game Button */}
            <button
              className="mt-4 w-full py-2 bg-blue-500 text-white rounded"
              onClick={() => {
                setGameover(false)
                setMoveList([])
                socket.send(JSON.stringify({
                  type: "play_game",
                  token: localStorage.getItem("token")
                }))
              }}
            >
              New Game →
            </button>

          </div>
        </div>
      )}


    </div>
  )
}

export default Gameboard