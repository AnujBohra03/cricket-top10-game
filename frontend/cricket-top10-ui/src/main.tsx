import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "./styles/global.css";
import App from './App.tsx'

import { getQuestion } from "./api/api";

getQuestion().then(console.log).catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
