import os
import sys

try:
    from dotenv import load_dotenv
    # Load .env from the project root
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    pass

try:
    from google import genai
except ImportError:
    print("Error: The 'google-genai' library is required.")
    sys.exit(1)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment.")
    sys.exit(1)

# Initialize the client
client = genai.Client(api_key=api_key)

print("Available models that support generateContent:\n")

try:
    for model in client.models.list():
        supported_actions = getattr(model, 'supported_actions', [])
        if 'generateContent' in supported_actions:
             print(f"- {model.display_name or model.name} ({model.name})")
except Exception as e:
    print(f"An error occurred: {e}")
