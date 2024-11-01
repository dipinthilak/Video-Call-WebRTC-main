import {Route,Routes} from 'react-router-dom'
import LobbyScreen from './screens/LobbyScreen';
import "./App.css"
import RoomPage from './screens/RoomPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<LobbyScreen/>} />
        <Route path='/room/:roomId' element={<RoomPage/>} />
      </Routes>
    
    </div>
  );
}

export default App;
