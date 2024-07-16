import logo from './logo.svg'
import './App.css'
import { useState } from 'react'
import axios from 'axios'

function App() {
  const [scripts, setScripts] = useState('')
  const [locators, setLocators] = useState('')

  const handleStart = async () => {
    try {
      console.log(1234)
      const response = await axios.get('http://localhost:3001/start')
      console.log(response)
    } catch (error) {
      console.error(error)
    }
  }

  const handleStop = async () => {
    try {
      const response = await axios.get('http://localhost:3001/stop')
      setScripts(response.data?.script || '')
    } catch (error) {
      console.error(error)
    }
  }

  const handleGetLocator = async () => {
    try {
      const response = await axios.get('http://localhost:3001/locators')
      setLocators(response.data?.elements || '')
    } catch (error) {
      console.error(error)
    }
  }

  console.log(locators)

  return (
    <div className='App'>
      <div>
        <img src={logo} className='App-logo' alt='logo' />
      </div>

      <div>
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleGetLocator}>Get Locator</button>
      </div>

      <pre>{scripts}</pre>
    </div>
  )
}

export default App

