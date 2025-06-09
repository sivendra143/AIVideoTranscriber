import http.server
import socketserver
import os

PORT = 8000
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the default directory to the project root
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)
    
    def do_GET(self):
        # Serve the complete.html file as the default page
        if self.path == '/' or self.path == '/index.html':
            self.path = '/complete.html'
            
        # Let the parent class handle everything else
        return super().do_GET()

print(f"Starting server at http://localhost:{PORT}")
print(f"Serving files from {PROJECT_ROOT}")
print(f"Press Ctrl+C to stop the server")

# Create the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
