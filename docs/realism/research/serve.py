"""Read-only static server for the built app (dist/) plus POST /__cap/<name>.png, which saves
rendered frames into the scratch folder (captures/). Nothing is written inside the project."""

import http.server
import os
import re
import sys

DIST = "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/dist"
CAP = "/private/tmp/claude-502/cathmaster-research/captures"
os.makedirs(CAP, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIST, **k)

    def do_GET(self):
        p = self.path.split("?")[0]
        if not os.path.exists(os.path.join(DIST, p.lstrip("/"))) or p == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        m = re.match(r"^/__cap/([A-Za-z0-9_.-]{1,80}\.png)$", self.path)
        if not m:
            self.send_response(400)
            self.end_headers()
            return
        n = int(self.headers.get("Content-Length", "0"))
        data = self.rfile.read(n)
        with open(os.path.join(CAP, m.group(1)), "wb") as f:
            f.write(data)
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
