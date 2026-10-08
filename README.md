# 🛡️ Guarding Online Grader Platform (Self-Hosted on Termux)

An enterprise-grade, lightweight, highly secure Online Grader platform built to run entirely on **Android (via Termux)** as the host machine within a Local Area Network (WLAN), powered by **Supabase Auth & Database**.

---

## 🏗️ System Architecture

```text
                       WLAN Clients (Laptops / Phones)
                                     │
                                     ▼
                          ┌───────────────────────┐
                          │  Android / Termux     │
                          │      Caddy :8080      │
                          └──────────┬────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
           /api/v1/*             /admin/*               /*
                 │                   │                   │
                 ▼                   ▼                   ▼
           FastAPI Backend       Admin SPA          Student SPA
         (127.0.0.1:8000)     (Static Build)      (Static Build)
                 │
                 ▼
         Redis Queue (127.0.0.1:6379)
                 │
                 ▼
          Grader Worker (Isolated Temporary Workspace & Sandboxing)
```

---

## 🚀 Quick Start on Termux (Android)

### 1. Initial Setup
```bash
# Clone the repository inside Termux
git clone <your-repo-url> guarding
cd guarding

# Run automated setup script
chmod +x scripts/*.sh
./scripts/setup_termux.sh
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Enter your Supabase URL, Anon Key, Service Role Key, and JWT Secret
```

### 3. Build Frontend
```bash
./scripts/build.sh
```

### 4. Start Platform
```bash
./scripts/start.sh
```

Access the portal from any device on the same Wi-Fi network:
- **Student Portal:** `http://<TERMUX-IP>:8080/`
- **Admin Dashboard:** `http://<TERMUX-IP>:8080/admin/`

To stop all services:
```bash
./scripts/stop.sh
```

---

## 🔒 Security Highlights
- **No Direct Open Internal Ports:** Redis (`:6379`) and FastAPI (`:8000`) listen strictly on `127.0.0.1`.
- **Single Entrypoint:** Only Caddy `:8080` is exposed to the local network.
- **Resource Sandboxing:** Uses `setrlimit` (CPU, memory, max process limits) and isolated temporary workspaces.
- **Data Protection:** Testcase files are fed exclusively via `stdin` and never exposed to the student binary.
- **Secret Isolation:** Supabase `service_role` key is strictly kept server-side in the backend and worker daemons.
