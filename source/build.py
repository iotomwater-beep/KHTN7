import pathlib
s=pathlib.Path('src')
css=(s/'style.css').read_text()
js='\n'.join((s/f).read_text() for f in ['bank.js','gen.js','calcbank.js','app.js','arena.js','online.js','tour.js','import.js','class.js','share.js','calcui.js','main.js'])
html=f'''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KHTN 7 – Đấu trường Khoa học tự nhiên</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0f8a5f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
<div class="wrap"><header id="hdr"></header><nav class="tabs" id="tabs"></nav><main id="view"></main>
<p class="small muted" style="text-align:center;margin-top:24px">KHTN 7 · Đấu trường · bám chương trình SGK Kết nối tri thức · dữ liệu lưu trên máy này</p></div>
<script>
{js}
</script>
</body>
</html>'''
pathlib.Path('dist').mkdir(exist_ok=True)
pathlib.Path('dist/KHTN7-dau-truong.html').write_text(html)
print(len(html))

# Bản web: thư mục web/ để đăng lên Netlify / Firebase Hosting
import json, shutil
w=pathlib.Path('web'); shutil.rmtree(w,ignore_errors=True); w.mkdir()
(w/'index.html').write_text(html)
(w/'icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0f8a5f"/><text x="256" y="300" font-family="Arial,sans-serif" font-size="200" font-weight="800" text-anchor="middle" fill="#fff">KHTN</text><text x="256" y="430" font-family="Arial,sans-serif" font-size="150" font-weight="800" text-anchor="middle" fill="#ffd43b">7</text></svg>')
(w/'manifest.webmanifest').write_text(json.dumps({"name":"KHTN 7 – Đấu trường","short_name":"KHTN 7","start_url":"./","display":"standalone","background_color":"#f3f7f4","theme_color":"#0f8a5f","icons":[{"src":"icon.svg","sizes":"any","type":"image/svg+xml"}]},ensure_ascii=False))
(w/'firebase.json').write_text(json.dumps({"hosting":{"public":".","ignore":["firebase.json"],"headers":[{"source":"**/*.html","headers":[{"key":"Cache-Control","value":"no-cache"}]}]}},indent=1))
