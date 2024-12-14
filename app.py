import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    print("Warning: GOOGLE_API_KEY not found in environment variables")
    GOOGLE_API_KEY = 'your_api_key_here'

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')

messages = []

# In-memory user storage (replace with database in production)
users = {}

def CustomGeminiAI(user_input):
    try:
        messages.append({"role": "user", "content": user_input})
        response = model.generate_content(user_input)
        
        # Format the response with markdown
        gemini_reply = response.text
        
        # Add markdown formatting for code blocks if they're not already formatted
        if '```' not in gemini_reply and any(keyword in user_input.lower() for keyword in ['code', 'function', 'program', 'error']):
            lines = gemini_reply.split('\n')
            in_code_block = False
            formatted_lines = []
            
            for line in lines:
                if line.strip().startswith('def ') or line.strip().startswith('class ') or line.strip().startswith('import '):
                    if not in_code_block:
                        formatted_lines.append('\n```python')
                        in_code_block = True
                elif in_code_block and not line.strip():
                    formatted_lines.append('```\n')
                    in_code_block = False
                formatted_lines.append(line)
            
            if in_code_block:
                formatted_lines.append('```')
            gemini_reply = '\n'.join(formatted_lines)

        # Add section headers for long responses
        if len(gemini_reply.split('\n')) > 10:
            gemini_reply = f"### Response\n{gemini_reply}"

        messages.append({"role": "assistant", "content": gemini_reply})
        return gemini_reply
    except Exception as e:
        print(f"Error in CustomGeminiAI: {str(e)}")
        return "I apologize, but I encountered an error processing your request."

@app.route('/')
def index():
    firebase_config = {
        'apiKey': os.getenv('FIREBASE_API_KEY'),
        'authDomain': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'projectId': os.getenv('FIREBASE_PROJECT_ID'),
        'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'messagingSenderId': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'appId': os.getenv('FIREBASE_APP_ID')
    }
    return render_template('index.html', firebase_config=firebase_config)

@app.route('/api', methods=['POST'])
def api():
    try:
        user_input = request.json.get('message')
        if user_input:
            response = CustomGeminiAI(user_input)
            return jsonify({'message': response})
        else:
            return jsonify({'error': 'Invalid input'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login')
def login():
    firebase_config = {
        'apiKey': os.getenv('FIREBASE_API_KEY'),
        'authDomain': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'projectId': os.getenv('FIREBASE_PROJECT_ID'),
        'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'messagingSenderId': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'appId': os.getenv('FIREBASE_APP_ID')
    }
    return render_template('login.html', firebase_config=firebase_config)

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    if email in users:
        return jsonify({'error': 'Email already exists'}), 400
    
    users[email] = generate_password_hash(password)
    return jsonify({'message': 'Account created successfully'})

@app.route('/generate-image', methods=['POST'])
def generate_image():
    try:
        prompt = request.json.get('prompt')
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # Use Gemini Pro model instead of Vision
        model = genai.GenerativeModel('gemini-pro')
        
        try:
            # Enhance the prompt for better image generation
            enhanced_prompt = f"""Please generate a proper image based on this description: {prompt}
            Requirements:
            - Must be a proper image URL
            - Should be high quality
            - Should match the description exactly
            - No ASCII art or text representations
            - Must be a direct image link
            Please only return the image URL, no other text."""
            
            response = model.generate_content(enhanced_prompt)
            
            # Extract URL from response
            response_text = response.text.strip()
            
            # Check if response contains a valid URL
            if response_text.startswith('http') and any(ext in response_text.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                return jsonify({
                    'url': response_text,
                    'prompt': prompt
                })
            else:
                # If no valid URL, return error message
                return jsonify({
                    'message': "I apologize, but I'm currently unable to generate images. I can help you with text-based responses instead."
                })
            
        except Exception as model_error:
            print(f"Model error: {str(model_error)}")
            return jsonify({
                'message': "I apologize, but I'm currently unable to generate images. Please try again later."
            })

    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return jsonify({'error': 'Failed to generate image'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
     