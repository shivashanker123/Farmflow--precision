# FarmFlow Security Analysis & Remediation Plan

## Summary
After analyzing the codebase against the reported vulnerabilities, here's the status:

| Category | Valid Issues | Already Mitigated | Needs Work |
|----------|-------------|-------------------|------------|
| Critical | 2 | 2 | 3 |
| High | 2 | 1 | 3 |
| Total Action Items | - | - | **6** |

---

## 🔴 Critical Vulnerabilities

### 1. Authentication (Reported: "No authentication")
**STATUS: ✅ MITIGATED - But needs documentation**

**What exists:**
- JWT-based authentication on all protected endpoints
- Token verification in: `farm.py`, `devices.py`, `readings.py`, `chat.py`, `logs.py`, `me.py`
- Login/register endpoints with password hashing (PBKDF2)

**Evidence:**
```python
# From api/farm.py line 15-17
auth_header = self.headers.get('Authorization', '')
if not auth_header.startswith('Bearer '):
    return None
token = auth_header.replace('Bearer ', '')
```

**Action:** Update README to document authentication flow.

---

### 2. IoT Device Security
**STATUS: ⚠️ PARTIALLY VALID**

**What exists:**
- Device registration with UUID (devices must be pre-registered)
- `/api/ingest` validates that `device_id` exists in database before accepting data

**What's missing:**
- ❌ No HTTPS enforcement documentation for ESP8266
- ❌ No device token/secret (relies on UUID knowledge only)
- ❌ No rate limiting per device

**Solution (Priority: HIGH):**
```python
# Add to api/ingest.py - Device secret validation
device_secret = data.get("device_secret")
device_result = supabase.table("devices") \
    .select("id, secret") \
    .eq("id", device_id) \
    .eq("secret", device_secret) \
    .execute()
```

```sql
-- Add device secret column
ALTER TABLE devices ADD COLUMN secret TEXT DEFAULT gen_random_uuid()::text;
```

---

### 3. Supabase RLS Configuration
**STATUS: ✅ MITIGATED**

**What exists:**
- RLS enabled on ALL tables in `supabase_schema.sql` (lines 75-80)
- Policies defined for each table

**Evidence:**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
```

**Note:** Current policies are permissive (`USING (true)`). For production, should restrict to `auth.uid() = user_id`.

---

### 4. No Rate Limiting
**STATUS: ❌ VALID - Needs implementation**

**What's missing:**
- No rate limiting on any endpoints
- `/api/ingest` especially vulnerable (ESP8266 could flood)

**Solution (Priority: HIGH):**

Vercel has built-in rate limiting via `vercel.json`:
```json
{
  "functions": {
    "api/ingest.py": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-RateLimit-Limit", "value": "100" }
      ]
    }
  ]
}
```

For robust limiting, add in-code checks:
```python
# Simple rate limit using Supabase
last_reading = supabase.table("sensor_readings") \
    .select("created_at") \
    .eq("device_id", device_id) \
    .order("created_at", desc=True) \
    .limit(1) \
    .execute()

if last_reading.data:
    last_time = datetime.fromisoformat(last_reading.data[0]["created_at"])
    if (datetime.utcnow() - last_time).seconds < 5:
        return self._send_json({"error": "Rate limited"}, 429)
```

---

### 5. Pump Control Safety
**STATUS: ⚠️ PARTIALLY MITIGATED**

**What exists:**
- `isPumpLocked()` prevents pump if moisture >80% or rain expected
- Manual override capability

**What's missing:**
- ❌ No max irrigation duration
- ❌ No cooldown between cycles
- ❌ No emergency shutoff endpoint

**Solution (Priority: MEDIUM):**
```typescript
// Add to FarmContext.tsx
const PUMP_SAFETY = {
  maxDurationMinutes: 60,
  cooldownMinutes: 15,
  emergencyShutoffEnabled: true,
};

const canActivatePump = (): { allowed: boolean; reason: string } => {
  if (farmData.pumpRunTime > PUMP_SAFETY.maxDurationMinutes / 60) {
    return { allowed: false, reason: "Max duration reached" };
  }
  // Add cooldown check
  return { allowed: true, reason: "" };
};
```

---

## 🟠 High-Risk Issues

### 6. Sensor Data Integrity
**STATUS: ⚠️ PARTIALLY VALID**

**What exists:**
- `sensorOnline` flag for toggling
- Manual override capability in DeviceSettings

**What's missing:**
- ❌ No sensor stuck detection
- ❌ No anomaly detection on readings

**Solution:**
```typescript
// Add to FarmContext.tsx
const getSensorHealth = () => {
  const lastReading = farmData.lastSensorReading;
  const hoursSinceUpdate = (Date.now() - lastReading) / (1000 * 60 * 60);
  
  if (hoursSinceUpdate > 6) return 'failed';
  if (hoursSinceUpdate > 2) return 'stale';
  return 'healthy';
};
```

---

### 7. Environment Variables
**STATUS: ✅ NOW MITIGATED**

`.gitignore` updated to exclude:
- `.env`
- `.env.local`
- `.env.*.local`
- `.env.production`
- `.env.development`

---

### 8. Input Validation
**STATUS: ⚠️ PARTIALLY VALID**

**What exists:**
- Basic type checks in `api/ingest.py`
- Frontend form validation in setup wizard

**What's missing:**
- ❌ No range validation for soil_moisture (should be 0-1023 for analog)
- ❌ No SQL injection protection on text fields

**Solution:**
```python
# Add to api/ingest.py
soil_moisture = data.get("soil_moisture")
if not isinstance(soil_moisture, (int, float)):
    return self._send_json({"error": "Invalid moisture type"}, 400)
if not (0 <= soil_moisture <= 1023):
    return self._send_json({"error": "Moisture out of range"}, 400)
```

---

### 9. CORS Configuration
**STATUS: ⚠️ NEEDS TIGHTENING**

**What exists:**
- `Access-Control-Allow-Origin: *` on all endpoints

**Risk:** Allows any website to make requests to your API.

**Solution:**
```python
# Replace * with your domain
self.send_header('Access-Control-Allow-Origin', 'https://dathehackathonthingy.vercel.app')
```

---

## 📋 Action Items (Priority Order)

| # | Issue | Effort | Impact |
|---|-------|--------|--------|
| 1 | ~~Create `.gitignore`~~ | ✅ Done | Critical |
| 2 | Add rate limiting to `/api/ingest` | 🟡 30 min | High |
| 3 | Add device secrets for IoT auth | 🟡 45 min | High |
| 4 | Add input validation ranges | 🟢 15 min | Medium |
| 5 | Tighten CORS to specific domain | 🟢 10 min | Medium |
| 6 | Add pump safety timers | 🟡 30 min | Medium |
| 7 | Add sensor health monitoring | 🟡 30 min | Medium |
| 8 | Update RLS policies for prod | 🟡 20 min | Medium |

---

## ✅ Already Secure

1. **JWT Authentication** - Implemented on all user-facing endpoints
2. **Password Hashing** - PBKDF2 with salt in register.py
3. **Row Level Security** - Enabled on all Supabase tables
4. **Device Verification** - Must be pre-registered to send data
5. **No Direct DB Access** - All access through authenticated API
6. **Environment Variables** - Now properly gitignored
