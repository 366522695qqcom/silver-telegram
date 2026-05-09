# Docker Swarm 部署指南

## 初始化 Swarm 集群

```bash
# 在主节点初始化
docker swarm init --advertise-addr <MANAGER-IP>

# 获取加入令牌
docker swarm join-token worker

# 在工作节点执行加入命令
docker swarm join --token <TOKEN> <MANAGER-IP>:2377
```

## 部署服务

```bash
# 部署堆栈
docker stack deploy -c docker-compose.swarm.yml ai-gateway

# 查看服务状态
docker stack ps ai-gateway
docker service ls

# 查看日志
docker service logs ai-gateway_backend
docker service logs ai-gateway_frontend

# 扩容前端服务
docker service scale ai-gateway_frontend=3

# 更新服务
docker service update --image ai-gateway-backend:v2 ai-gateway_backend

# 删除堆栈
docker stack rm ai-gateway
```

## 集群管理

```bash
# 查看节点
docker node ls

# 查看节点详情
docker node inspect <NODE-ID>

# 排空节点（维护）
docker node update --availability drain <NODE-ID>

# 重新激活节点
docker node update --availability active <NODE-ID>
```
