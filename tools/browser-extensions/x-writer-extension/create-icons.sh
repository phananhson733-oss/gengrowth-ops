#!/bin/bash
# 用 macOS 内置工具生成简单图标（需要 Xcode Command Line Tools）
# 运行: bash create-icons.sh

# 创建 SVG 图标
cat > /tmp/xwriter-icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#1d9bf0"/>
  <text x="64" y="88" font-size="72" text-anchor="middle" fill="white" font-family="sans-serif">✍️</text>
</svg>
EOF

# 使用 qlmanage 或 sips 转换（macOS 自带）
for size in 16 48 128; do
  qlmanage -t -s $size -o /tmp/ /tmp/xwriter-icon.svg 2>/dev/null || \
  sips -z $size $size /tmp/xwriter-icon.svg --out /tmp/icon${size}.png 2>/dev/null

  # Fallback: 创建纯色占位图
  if [ ! -f "/tmp/icon${size}.png" ]; then
    python3 -c "
import struct, zlib

def create_solid_png(size, color):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    raw = b''
    for _ in range(size):
        row = b'\x00'
        for _ in range(size):
            row += bytes(color)
        raw += row

    compressed = zlib.compress(raw)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

with open('/tmp/icon${size}.png', 'wb') as f:
    f.write(create_solid_png(${size}, [29, 155, 240]))
"
  fi

  cp /tmp/icon${size}.png ./icon${size}.png
  echo "Created icon${size}.png"
done

echo "Done! Icons created in current directory."
