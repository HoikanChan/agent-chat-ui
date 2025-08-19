// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Routes, Route } from 'react-router-dom';
import { ThemeProviderWrapper } from '~/components/deer-flow/theme-provider-wrapper';
import { Toaster } from '~/components/deer-flow/toaster';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <ThemeProviderWrapper>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/bot" element={<ChatPage />} />
      </Routes>
      <Toaster />
    </ThemeProviderWrapper>
  );
}

export default App;
