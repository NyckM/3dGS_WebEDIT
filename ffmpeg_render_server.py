"""Servidor local para codificar PNG sequences do visualizador com FFmpeg.
Execute: python ffmpeg_render_server.py
Depois abra o index.html normalmente e escolha "Vídeo CFR — FFmpeg local".
"""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import json, shutil, subprocess, tempfile, time, uuid, zipfile

ROOT = Path(__file__).resolve().parent
RENDERS = ROOT / "renders"
RENDERS.mkdir(exist_ok=True)

def safe_extract(archive, target):
    root = target.resolve()
    for info in archive.infolist():
        out = (target / info.filename).resolve()
        if not str(out).startswith(str(root)):
            raise ValueError("arquivo inválido no ZIP")
    archive.extractall(target)

class Handler(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def send_json(self, code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code); self.cors(); self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def do_GET(self):
        part = urlparse(self.path).path
        if not part.startswith("/files/"):
            return self.send_json(200, {"ok": True, "service": "ffmpeg render"})
        name = Path(part.removeprefix("/files/")).name
        file = RENDERS / name
        if not file.is_file(): return self.send_json(404, {"error": "arquivo não encontrado"})
        self.send_response(200); self.cors(); self.send_header("Content-Type", "application/octet-stream"); self.send_header("Content-Disposition", f'attachment; filename="{name}"'); self.send_header("Content-Length", str(file.stat().st_size)); self.end_headers()
        with file.open("rb") as f: shutil.copyfileobj(f, self.wfile)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/render": return self.send_json(404, {"error": "rota inválida"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 1 or size > 5 * 1024 * 1024 * 1024: raise ValueError("tamanho de ZIP inválido")
            q = parse_qs(parsed.query); fps = int(q.get("fps", ["24"])[0]); codec = q.get("codec", ["h264"])[0]
            if fps not in (24, 25): raise ValueError("fps precisa ser 24 ou 25")
            if codec not in ("h264", "hevc", "prores"): raise ValueError("codec inválido")
            raw = self.rfile.read(size)
            with tempfile.TemporaryDirectory(prefix="bruxos-render-") as tmp:
                tmp = Path(tmp); incoming = tmp / "sequence.zip"; incoming.write_bytes(raw)
                with zipfile.ZipFile(incoming) as z: safe_extract(z, tmp)
                pattern = tmp / "frames" / "frame_%06d.png"
                if not (tmp / "frames" / "frame_000000.png").is_file(): raise ValueError("sequência PNG não encontrada")
                stamp = time.strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:6]
                if codec == "h264":
                    output = RENDERS / f"timeline_{stamp}_h264.mp4"; extra = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
                elif codec == "hevc":
                    output = RENDERS / f"timeline_{stamp}_hevc.mp4"; extra = ["-c:v", "libx265", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p10le", "-tag:v", "hvc1"]
                else:
                    output = RENDERS / f"timeline_{stamp}_prores422.mov"; extra = ["-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le"]
                cmd = ["ffmpeg", "-y", "-framerate", str(fps), "-start_number", "0", "-i", str(pattern), *extra, str(output)]
                run = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
                if run.returncode != 0: raise RuntimeError(run.stderr[-1000:] or "FFmpeg falhou")
            self.send_json(200, {"ok": True, "name": output.name, "url": f"http://127.0.0.1:8765/files/{output.name}"})
        except Exception as exc:
            self.send_json(500, {"error": str(exc)})

    def log_message(self, fmt, *args):
        print("[render] " + fmt % args)

if __name__ == "__main__":
    print("FFmpeg Render Server: http://127.0.0.1:8765")
    ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
