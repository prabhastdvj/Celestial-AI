
# Celestial AI Chatbot

A sophisticated AI chatbot built with Flask and Google's Generative AI, featuring Firebase integration for data persistence.

## Overview

Celestial AI is an intelligent chatbot application that leverages Google's latest AI technology to provide natural, context-aware conversations. The application is built with a modern tech stack and focuses on delivering a seamless chat experience.

## Features

- Real-time AI-powered conversations
- Context-aware responses
- Secure authentication via Firebase
- Message history persistence
- Modern, responsive interface

## Tech Stack

- **Backend**: Python/Flask
- **AI Engine**: Google Generative AI
- **Database**: Firebase
- **Authentication**: Firebase Auth
- **Environment Management**: python-dotenv

## Prerequisites

- Python 3.11 or higher
- Firebase account and project setup
- Google Cloud project with Generative AI API access

## Installation


2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```
# On Windows: venv\Scripts\activate

3. Install the required packages:

```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Replace your keys in this `.env` file in the project root with the following variables:

```
GOOGLE_API_KEY=your-google-api-key
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
```


## Configuration

1. Set up Firebase:
   - Create a new Firebase project
   - Download your Firebase credentials JSON file name the files as `firebase-adminsdk.json` and place it in the root of the project
  
2. Configure Google Cloud:
   - Enable the Generative AI API in your Google Cloud project
   - Create an API key and add it to your `.env` file

## Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Access the application in your browser at `http://localhost:5000`



## Usage

1. Sign in using Firebase authentication
2. Start a new conversation with the AI
3. View your chat history
4. Enjoy natural, context-aware conversations

## Development

- Follow PEP 8 style guidelines
- Use meaningful commit messages
- Create feature branches for new development
- Write tests for new features


## Acknowledgments

- Google Generative AI team
- Firebase team
- Flask community
- All contributors to this project

## Support

For support, please open an issue in the GitHub repository.
