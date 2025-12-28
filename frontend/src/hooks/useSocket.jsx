const url = "ws://localhost:8000"
import { useState,useEffect } from "react"
const useSocket = (onMessage) => {
    const [socket , setSocket] = useState(null)

    useEffect(()=>{
         const ws = new WebSocket(url)
     ws.onmessage = (event) =>{
            const data = JSON.parse(event.data)
            console.log("data received",data)
            if(onMessage) onMessage(data)
         }
    ws.onopen = ()=>{
        console.log("finally socket is connect to the backend")
        ws.send(JSON.stringify(
            {
                type:"identify",
                token:localStorage.getItem("token")
            }
        ))
        setSocket(ws)
    }
    ws.onclose = ()=>{
        console.log("hey you are disconnected form the backend websocket")
      
    }
    return ()=>{
        ws.close()
    }
    
    },[])
    return socket
}

export default useSocket