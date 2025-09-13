from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse as urlparse

class RivalisHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5174')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            response = {
                'success': True,
                'message': 'Rivalis API está funcionando!',
                'timestamp': '2025-09-13T00:00:00.000Z'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except:
            data = {}
        
        if self.path == '/api/auth/register':
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            response = {
                'success': True,
                'message': 'Usuário criado com sucesso!',
                'user': {
                    'id': 1,
                    'name': data.get('name', 'Usuário'),
                    'email': data.get('email', 'email@test.com')
                }
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/auth/login':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            response = {
                'success': True,
                'message': 'Login realizado com sucesso!',
                'user': {
                    'id': 1,
                    'name': 'Usuário Teste',
                    'email': data.get('email', 'email@test.com')
                },
                'token': 'fake-jwt-token-for-development'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 5000), RivalisHandler)
    print('🚀 Servidor Python Rivalis rodando na porta 5000')
    print('🌍 Health check: http://localhost:5000/health')
    server.serve_forever()