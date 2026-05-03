// Import React hooks for managing state and side effects
import { useEffect, useState } from 'react';

// Define our main App component
function App() {
  // STATE: This stores data that can change over time
  // message: the actual data (starts as empty string)
  // setMessage: function to update the message
  const [message, setMessage] = useState<string>('');

  // ERROR STATE: Store any errors that happen
  const [error, setError] = useState<string>('');

  // LOADING STATE: Track if we're waiting for data
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // EFFECT: This runs automatically when component first loads
  // useEffect runs code at specific times (here: when component mounts)
  useEffect(() => {
    // ASYNC FUNCTION: fetchData doesn't run immediately,
    // it returns a Promise that resolves later
    const fetchData = async () => {
      try {
        // FETCH: This is how React asks the backend for data
        // We use the FULL URL because frontend/backend are on different ports
        const response = await fetch('http://localhost:3000/');

        // Check if the response was successful
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON response into a JavaScript object
        const data = await response.json();

        // Update the message state with the data from backend
        setMessage(data.message);

      } catch (err) {
        // If anything goes wrong, store the error message
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        // This runs no matter what (success or error)
        setIsLoading(false);
      }
    };

    // Actually call the function we defined above
    fetchData();
  }, []); // Empty array [] means "run once when component loads"

  // RENDER: This decides what to show on screen
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Frontend-Backend Connection Demo</h1>

      {/* Show loading message while waiting */}
      {isLoading && <p>Loading message from backend...</p>}

      {/* Show error if something went wrong */}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Show the message when we have it */}
      {!isLoading && !error && (
        <div>
          <h2>Message from Backend:</h2>
          <p style={{ fontSize: '24px', color: 'blue' }}>{message}</p>
        </div>
      )}
    </div>
  );
}

export default App;