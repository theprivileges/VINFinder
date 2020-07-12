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

  /**
   * Quick way to reset everything so the end-user can look up other vehicles from a different insurer
   */
  const resetUI = () => {
    setIsReady(false)
    setIsAuthenticated(false)
    setError(null)
  }

  /**
   * Iterates over all available vehicles for a given policy, so we can display them to the end-user.
   * @param {Object} policy - Policy belonging to the end user
   * @param {Array} policy.vehicles - List of vehicles associated with the given policy
   */
  const getPolicyVehicles = ({vehicles}) => {
    vehicles.forEach(({make, model, year, vin}) => setAutos((prev) => [...prev, {make, model, year, vin }]))
  }

  /**
   * Calls the Accounts end-point in order to get policies associated with the authorized user.
   * @see https://trellisconnect.com/docs?#trellis-connect-api-accounts
   */
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

  /**
   * This effect will configure the Trellis SDK when the component mounts, and will destroy it when the component unmounts.
   * Use a ref to keep track of the Trellis SDK Client because we do not want to cause any re-renders when the client gets updated. 
   */
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

  /**
   * Opens the Trellis Widget
   */
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
          <div>
            <p>We are still waiting a response from your insurance provider.</p>
            <p>Click on the <kbd>Refresh</kbd> button to check on the status of your request.</p>
            <button onClick={fetchPolicies}>Refresh</button>
          </div>
        )}
        {showResults && (
          <div>
            <ul>
            {autos.map(({make, model, year, vin}) => (
              <li key={vin}>
                Make:{make} Model:{model} ({year}) VIN: <strong>{vin}</strong>
              </li>
            ))}
            </ul>
            <div>
              <button onClick={resetUI}>Reset</button>
            </div>
          </div>
        )}
        {error && (
          <div>
            <pre>{error}</pre>
            <button onClick={resetUI}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
