import { passiveSupport } from 'passive-events-support/src/utils';
passiveSupport({ debug: true });
import MapComponent from './layout/GMaps';
import './globals.css';

function App() {

  return (
    <>
      {/* <h1 className="flex text-3xl font-bold underline">
        Hello world!
      </h1> */}
      <MapComponent />
    </>
  )
}

export default App
