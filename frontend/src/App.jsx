import './App.css'
import ChessHome from './pages/home.jsx'
import {Routes , Route} from "react-router-dom"
import Gameboard from "./pages/gameboard.jsx"
import Protectedroute from './components/protectedroute.jsx'

function App() {
 
  return (
    <Routes>
      <Route path='/' element={<ChessHome/>}/>
      <Route path='/game' element={<Protectedroute>
        <Gameboard/>
      </Protectedroute>}/>

    </Routes>
  )
}

export default App
