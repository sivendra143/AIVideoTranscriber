import http.server
import socketserver
import os
import json
import time
import random
import io
import tempfile

PORT = 8000
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(PROJECT_ROOT, 'uploads')

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Sample paragraphs for fake transcription
SAMPLE_PARAGRAPHS = [
    "Welcome to our presentation on artificial intelligence and machine learning. Today, we'll explore how these technologies are transforming industries across the globe.",
    "First, let's define what we mean by AI. Artificial intelligence refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. This includes problem-solving, recognizing speech, and making decisions.",
    "Machine learning, a subset of AI, uses algorithms to parse data, learn from it, and make informed decisions. The key difference is that with machine learning, computers learn without being explicitly programmed.",
    "Deep learning takes this a step further by using neural networks with many layers. This architecture allows the system to learn complex patterns in large amounts of data.",
    "Now, let's look at some real-world applications. In healthcare, AI is being used to diagnose diseases from medical imaging with accuracy rivaling human doctors. In finance, it's detecting fraudulent transactions in real-time.",
    "The transportation industry is being revolutionized with self-driving vehicles. Companies like Tesla, Waymo, and Uber are investing heavily in this technology.",
    "However, with these advancements come challenges and ethical considerations. Privacy concerns, potential job displacement, and algorithmic bias are just some of the issues we need to address.",
    "In conclusion, AI and machine learning are not just futuristic concepts but present-day tools transforming our world. Understanding their capabilities and limitations is essential for navigating our increasingly automated future.",
    "Natural Language Processing, or NLP, is another exciting branch of AI focused on enabling computers to understand and generate human language. NLP powers virtual assistants like Siri, Alexa, and Google Assistant, as well as translation services and text analysis tools.",
    "Computer vision is the field of AI that enables machines to interpret and make decisions based on visual data. Applications range from facial recognition systems to autonomous vehicles that need to 'see' and interpret their surroundings.",
    "Reinforcement learning is a type of machine learning where agents learn to make decisions by performing actions and receiving rewards or penalties. This approach has been used to train AI systems that have defeated human champions in games like chess, Go, and poker.",
    "Edge computing brings AI processing closer to where data is generated, rather than relying on centralized cloud servers. This reduces latency and enhances privacy, making it crucial for applications like IoT devices and real-time decision systems.",
    "Transfer learning has revolutionized how we build AI models. Instead of training from scratch, we can take pre-trained models and fine-tune them for specific tasks, saving enormous amounts of time and computational resources.",
    "Explainable AI (XAI) focuses on making AI systems more transparent and understandable to humans. This is particularly important in fields like healthcare and finance, where stakeholders need to understand why an AI made a particular decision.",
    "Quantum computing promises to accelerate certain AI algorithms exponentially. While still in its early stages, the intersection of quantum computing and AI is an exciting frontier that could lead to breakthroughs in optimization, simulation, and machine learning.",
    "The ethical implications of AI extend beyond privacy concerns. Questions about accountability, transparency, fairness, and potential misuse require thoughtful consideration from developers, policymakers, and society at large.",
    "Federated learning is a privacy-preserving approach where AI models are trained across multiple devices or servers without exchanging the underlying data. This allows for collaborative learning while keeping sensitive information local.",
    "AI's impact on the job market is nuanced. While some roles may be automated, history suggests that technology often creates more jobs than it eliminates. The key is to ensure that workers can adapt through education and training.",
    "Generative AI models like GPT can create content that appears to be written by humans. These models have applications in creative writing, code generation, content creation, and even assisting with scientific research.",
    "The environmental impact of training large AI models is significant. Researchers are exploring ways to make AI more energy-efficient, from optimizing algorithms to developing specialized hardware.",
    "AI is transforming education through personalized learning experiences, automated grading, and intelligent tutoring systems that adapt to individual student needs and learning styles.",
    "In healthcare, AI is not just improving diagnostics but also drug discovery, patient monitoring, treatment planning, and healthcare administration, potentially saving lives while reducing costs.",
    "Autonomous robots are becoming increasingly sophisticated, with applications in manufacturing, agriculture, disaster response, space exploration, and even household chores.",
    "Smart cities use AI to optimize traffic flow, reduce energy consumption, improve public safety, and enhance the quality of life for residents through more efficient urban planning and resource management."
]

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
    
    def do_POST(self):
        # Handle file uploads
        if self.path == '/api/upload':
            try:
                content_length = int(self.headers['Content-Length'])
                content_type = self.headers['Content-Type']
                
                # Check for multipart form data
                if content_type and 'multipart/form-data' in content_type:
                    # Get the boundary
                    boundary = content_type.split('=')[1].strip()
                    boundary_bytes = boundary.encode()
                    
                    # Read the content
                    data = self.rfile.read(content_length)
                    
                    # Find the file data in the multipart content
                    # This is a simplified approach - in production, use proper multipart parsing
                    file_start = data.find(b'filename=')
                    if file_start != -1:
                        # Extract filename
                        filename_start = data.find(b'"', file_start) + 1
                        filename_end = data.find(b'"', filename_start)
                        filename = data[filename_start:filename_end].decode('utf-8')
                        
                        # Find the start of the file data (after double \r\n)
                        content_type_pos = data.find(b'Content-Type:', file_start)
                        header_end = data.find(b'\r\n\r\n', content_type_pos) + 4
                        
                        # Find the end of the file data (before the closing boundary)
                        file_end = data.find(b'--' + boundary_bytes + b'--', header_end)
                        if file_end == -1:  # If the final boundary is not found
                            file_end = data.find(b'\r\n--' + boundary_bytes, header_end)
                        
                        if header_end != -1 and file_end != -1:
                            file_data = data[header_end:file_end]
                            
                            # Create the uploads directory if it doesn't exist
                            os.makedirs(UPLOAD_DIR, exist_ok=True)
                            
                            # Save the file
                            file_path = os.path.join(UPLOAD_DIR, filename)
                            with open(file_path, 'wb') as f:
                                f.write(file_data)
                            
                            # Simulate processing time based on file size
                            file_size = len(file_data)
                            processing_time = min(3, max(1, file_size / (1024 * 1024) * 0.5))
                            time.sleep(processing_time)
                            
                            # Generate fake transcript based on file size
                            transcript = generate_fake_transcript(file_size)
                            
                            # Return success response
                            self.send_response(200)
                            self.send_header('Content-type', 'application/json')
                            self.send_header('Access-Control-Allow-Origin', '*')
                            self.end_headers()
                            response = {
                                'success': True, 
                                'message': 'File uploaded successfully',
                                'filename': filename,
                                'transcript': transcript
                            }
                            self.wfile.write(json.dumps(response).encode('utf-8'))
                            return
                
                # If we got here, something went wrong with form processing
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    'success': False,
                    'message': 'No file was uploaded or invalid form data'
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            
            except Exception as e:
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    'success': False,
                    'message': f'An error occurred: {str(e)}'
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def generate_fake_transcript(file_size=None):
    """Generate a fake transcript from sample paragraphs based on file size"""
    # Determine the number of paragraphs based on file size
    if file_size:
        # Convert bytes to MB
        size_mb = file_size / (1024 * 1024)
        # Base scale factor: 1MB = 5-10 paragraphs
        # Cap at 30 paragraphs for very large files
        num_paragraphs = min(30, int(size_mb * random.uniform(5, 10)))
        # Ensure at least 5 paragraphs
        num_paragraphs = max(5, num_paragraphs)
    else:
        # Default: 5-10 paragraphs
        num_paragraphs = random.randint(5, 10)
    
    # Generate paragraphs - repeat from sample paragraphs if needed
    transcript_paragraphs = []
    for i in range(num_paragraphs):
        # Use modulo to repeat sample paragraphs when needed
        paragraph_index = i % len(SAMPLE_PARAGRAPHS)
        # Add timestamps at the beginning of each paragraph
        minutes = i * 2
        seconds = random.randint(0, 59)
        timestamp = f"[{minutes:02d}:{seconds:02d}] "
        paragraph = timestamp + SAMPLE_PARAGRAPHS[paragraph_index]
        
        # Add some variety by sometimes inserting speaker identification
        if random.random() < 0.3:
            speakers = ["Speaker 1", "Speaker 2", "Interviewer", "Respondent"]
            paragraph = f"{random.choice(speakers)}: {paragraph}"
            
        transcript_paragraphs.append(paragraph)
    
    return '\n\n'.join(transcript_paragraphs)

print(f"Starting server at http://localhost:{PORT}")
print(f"Serving files from {PROJECT_ROOT}")
print(f"Upload directory: {UPLOAD_DIR}")
print(f"Press Ctrl+C to stop the server")

# Create the server with ability to reuse the address
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        httpd.server_close()
