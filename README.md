# MindfulMate: Student Mental Health Companion

An AI-powered web application designed to support student mental well-being through empathetic conversation, mood tracking, and relaxation techniques.

## Features

- **AI Chatbot**: Powered by Google Gemini API, providing empathetic and supportive responses.
- **Sentiment Analysis**: Automatically detects user mood (Happy, Neutral, Stressed, Sad, Anxious, Angry).
- **Mood History**: Visual representation of emotional patterns over time using Recharts.
- **User Authentication**: Secure sign-up and log-in system to maintain private chat history and profiles.
- **Safety First**: Includes crisis detection and mental health disclaimers.
- **Modern UI**: Calming color palette, dark mode support, and responsive design.
- **Relaxation Tips**: Integrated suggestions for breathing exercises and meditation.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts, Motion.
- **Backend**: Node.js, Express, Better-SQLite3.
- **AI**: Google Gemini API (@google/genai).
- **Authentication**: JWT with secure cookies.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Ensure `GEMINI_API_KEY` is set in your environment.

3. **Run the Application**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Safety Disclaimer

This chatbot is for support only and is not a replacement for professional mental health care. In case of emergency, please contact local emergency services or a mental health professional.
