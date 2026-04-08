#!/usr/bin/env bash
# 在 exchange-server 根目录执行本脚本（不要写成：cd 路径 ./脚本 中间要有 &&）
# 用法：
#   ./start-backend.sh
#   SERVER_PORT=8082 ./start-backend.sh    # 8080 已被占用时换端口
set -e
cd "$(dirname "$0")"

PORT="${SERVER_PORT:-8080}"
echo ">>> 启动 exchange-boot，端口 ${PORT}（若提示端口占用，可先关掉旧进程或 SERVER_PORT=8082 ./start-backend.sh）"
exec mvn -pl exchange-boot -am spring-boot:run -Dspring-boot.run.arguments="--server.port=${PORT}"
