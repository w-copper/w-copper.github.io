+++
date = '{{ .Date }}'
draft = true
title = 'ubuntu使用tun2socks进行全局代理'
+++

`tun2socks` 是一种实现全局代理的高级技术，它通过创建虚拟网络接口（TUN 设备）和修改路由表，将所有网络流量（包括 TCP/UDP）重定向到 SOCKS 代理。以下是详细实现原理和操作步骤：

---

### 一、tun2socks 工作原理

1. **创建虚拟网卡**：创建 TUN 虚拟网络设备（如 `tun0`），作为系统的新网络接口。
2. **路由重定向**：修改系统路由表，将所有流量（或特定流量）指向虚拟网卡。
3. **流量拦截与转换**：tun2socks 监听虚拟网卡：

   - 读取原始 IP 数据包
   - 将 TCP/UDP 流量转换为 SOCKS 协议格式
   - 通过本地 SOCKS 代理（如 `127.0.0.1:1080`）转发
4. **响应处理**：
   将代理返回的数据重新封装为原始 IP 数据包，写回虚拟网卡。

---

### 二、Ubuntu 22.04 实现步骤

#### 1. 安装必要工具

```bash
sudo apt update
sudo apt install iproute2 net-tools

# 安装 tun2socks (推荐使用 go 版本)
sudo apt install golang
go install github.com/eycorsican/go-tun2socks/cmd/tun2socks@latest
```

#### 2. 创建并配置 TUN 设备

```bash
# 创建 TUN 设备
sudo ip tuntap add dev tun0 mode tun

# 分配 IP 地址（使用私有 IP 段）
sudo ip addr add 10.0.0.1/24 dev tun0

# 启用设备
sudo ip link set dev tun0 up
```

#### 3. 配置路由表

```bash
# 添加默认路由到 TUN 设备
sudo ip route add default via 10.0.0.2 dev tun0

# 排除本地 SOCKS 代理（避免回环）
sudo ip route add 127.0.0.1 via $(ip route show default | awk '{print $3}') dev $(ip route show default | awk '{print $5}')
```

#### 4. 启动 tun2socks

```bash
# 假设 SOCKS5 代理在 127.0.0.1:1080
sudo ~/go/bin/tun2socks -device tun0 -proxy socks5://127.0.0.1:1080
```

#### 5. 配置 DNS（关键！）

```bash
# 方法1：使用 DNS over TCP（推荐）
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# 方法2：使用 dns2socks 工具
sudo apt install dns2socks
dns2socks 127.0.0.1:1080 8.8.8.8:53 127.0.0.1:53 &
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

#### 6. 启用 IP 转发（可选）

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

---

### 三、持久化配置（开机自启）

创建 systemd 服务：

```bash
sudo nano /etc/systemd/system/tun2socks.service
```

内容如下：

```ini
[Unit]
Description=tun2socks Proxy
After=network.target

[Service]
Type=simple
ExecStartPre=/sbin/ip tuntap add dev tun0 mode tun
ExecStartPre=/sbin/ip addr add 10.0.0.1/24 dev tun0
ExecStartPre=/sbin/ip link set dev tun0 up
ExecStartPre=/sbin/ip route add default via 10.0.0.2 dev tun0
ExecStart=/home/$USER/go/bin/tun2socks -device tun0 -proxy socks5://127.0.0.1:1080
ExecStopPost=/sbin/ip link del dev tun0
Restart=always

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tun2socks
```

---

### 四、验证与测试

```bash
# 检查路由
ip route show

# 测试 TCP
curl --connect-timeout 5 http://ipinfo.io

# 测试 UDP (DNS)
dig +tcp @8.8.8.8 google.com  # 必须使用 TCP
```

---

### 五、高级配置技巧

1. **排除特定流量**：

   ```bash
   # 排除内网流量
   sudo ip route add 192.168.0.0/16 via $(ip route show default | awk '{print $3}')
   ```
2. **UDP 支持优化**：使用支持 UDP 的 tun2socks 版本：

   ```bash
   go install -tags 'udpgw' github.com/eycorsican/go-tun2socks/cmd/tun2socks@latest
   ```
3. **性能优化**：

   ```bash
   # 增大 socket 缓冲区
   sudo sysctl -w net.core.rmem_max=26214400
   sudo sysctl -w net.core.wmem_max=26214400
   ```
4. **多协议支持**：
   直接对接 V2Ray/Xray：

   ```bash
   tun2socks -device tun0 -proxy socks5://127.0.0.1:1080 -udpgw 127.0.0.1:7300
   ```

---

### 六、常见问题解决

1. **DNS 解析失败**：

   - 确保使用 TCP DNS (`dig +tcp`)
   - 检查 `/etc/resolv.conf` 配置
   - 使用 `dns2socks` 或 `dnscrypt-proxy`
2. **连接速度慢**：

   ```bash
   # 调整 MTU
   sudo ip link set dev tun0 mtu 1400
   ```
3. **部分应用不工作**：

   ```bash
   # 检查应用是否使用原始套接字
   sudo tcpdump -i tun0 -n
   ```
4. **服务启动失败**：
   检查日志：

   ```bash
   journalctl -u tun2socks -f
   ```

---

通过以上配置，所有应用程序（包括命令行工具、GUI 应用、系统服务）的网络流量都将通过 SOCKS 代理，实现真正的系统级全局代理。
