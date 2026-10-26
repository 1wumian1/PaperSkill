import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/paper-tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/vstar-paper.css';
import './styles/interactions.css';
import './styles/story.css';
import './styles/paper-skill-frame.css';
import './styles/vista4d-chapter.css';
import './styles/inspatio-sidebar.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
