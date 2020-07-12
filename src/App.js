/* global TrellisConnect */
import fetch from 'cross-fetch'
import React, {useRef, useEffect, useState } from 'react'
import './App.css';

const CLIENT_ID = 'CHALLENGE'
const SECRET_KEY = 'CHALLENGESECRET'

function App() {
  const client = useRef()
  const [accountId, setAccountId] = useState(null)
  const [error, setError] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [autos, setAutos] = useState([])

  const resetUI = () => {
    setIsReady(false)
    setIsAuthenticated(false)
    setError(null)
  }

  const getPolicyVehicles = ({vehicles}) => {
    vehicles.forEach(({make, model, year, vin}) => setAutos((prev) => [...prev, {make, model, year, vin }]))
  }

  const fetchPolicies = async () => {
    try {
      const headers = {
        'Accept':'application/json',
        'X-API-Client-Id': CLIENT_ID,
        'X-API-Secret-Key': SECRET_KEY,
      }
      const response = await fetch(`https://api.trellisconnect.com/trellis/connect/1.2.0/account/${accountId}/policies`,
      {
        method: 'GET',
        headers,
        credentials: 'same-origin'
      })
      if (!response.ok) {
        throw new Error(response.error)
      }
      const { status, policies } = await response.json()
      if (status === 'NOT_READY') {
        setIsReady(false)
      }
      if (status === 'READY') {
        setIsReady(true)
        policies.forEach((policy) => getPolicyVehicles(policy))
      }
    } catch (error) {
      setError(error.message)
    }
  }

  useEffect(() => {
    // Configure Trellis SDK
    client.current = TrellisConnect.configure({
      client_id: CLIENT_ID,
      features: 'nostickystate',
      onSuccess: (id) => {
        setAccountId(id)
      },
      onFailure: () => setError('We could not authenticate you with your insurance provider. Please try again later.'),
      onClose: (error, _) => { 
        if (error) setError(error)
      },
      onEvent: (event, _) => {
        if (event === 'AUTH_COMPLETE') {
          setIsAuthenticated(true)
        }
      }
    })
    // Remove SDK
    return () => {
      client.current.destroy()
    }
  }, [])

  const openWidget = () => client.current.open()
  const showRefreshButton = isAuthenticated && !isReady
  const showResults = isAuthenticated && isReady

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Use this application to quickly locate your vehicle's VIN.
        </p>
      </header>
      <div className="App-controls">
        {!isAuthenticated && (<button onClick={openWidget}>Lookup your VIN</button>)}
        {showRefreshButton && (
          <button onClick={fetchPolicies}>Refresh</button>
        )}
        {showResults && (
          <>
            <ul>
            {autos.map(({make, model, year, vin}) => (
              <li key={vin}>
                Make:{make} Model:{model} ({year}) VIN: {vin}
              </li>
            ))}
            </ul>
            <button onClick={resetUI}>Reset</button>
          </>
        )}
        {error && (
          <pre>{error}</pre>
        )}
      </div>
    </div>
  );
}

export default App;
