import sys
import os

# Append the project root directory so backend package can be imported properly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app