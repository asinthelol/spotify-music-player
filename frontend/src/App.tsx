import { useState, useEffect } from 'react';
import WebPlayback from './components/WebPlayback/WebPlayback';
import Login from './components/Login/Login';
import './styles/global.scss';

export default function App() {
  const [token, setToken] = useState('');

  useEffect(() => {

    async function getToken() {
      const response = await fetch('/auth/token');
      const json = await response.json();
      setToken(json.access_token);
    }

    getToken();

  }, []);

  return (
    <>
      { (token === '') ? <Login/> : <WebPlayback token={token} /> }
    </>
  );
}