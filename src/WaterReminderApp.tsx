import React, { useEffect, useMemo, useRef, useState } from "react"

// Simple React component that:
// 1) Builds a hydration reminder schedule between wake & sleep times
// 2) Skips reminders around main meals (buffer before & after)
// 3) Shows progress toward a daily goal and triggers Web Notifications
// 4) Minimal Tailwind UI; drop-in for Vite/React

export default function WaterReminderApp() {
  const now = new Date();
  const hhmm = (d: Date) => d.toTimeString().slice(0, 5);
  const withTime = (base: Date, hhmmStr: string) => {
    const [h, m] = hhmmStr.split(":").map(Number);
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const [wakeTime, setWakeTime] = useState("07:30");
  const [sleepTime, setSleepTime] = useState("22:30");
  const [intervalMin, setIntervalMin] = useState(60);
  const [goalLiters, setGoalLiters] = useState(2.2);
  const [cupSizeMl, setCupSizeMl] = useState(250);

  const [breakfast, setBreakfast] = useState("07:00");
  const [lunch, setLunch] = useState("12:00");
  const [dinner, setDinner] = useState("19:00");
  const [mealBufferMin, setMealBufferMin] = useState(30);

  const [allowTinySips, setAllowTinySips] = useState(false);

  const [consumedMl, setConsumedMl] = useState(0);
  const goalMl = useMemo(() => Math.round(goalLiters * 1000), [goalLiters]);

  type Slot = {
    time: Date;
    label: string;
    blockedByMeal: boolean;
  };

  const mealWindows = useMemo(() => {
    const base = new Date();
    const makeWindow = (hhmmStr: string) => {
      const start = withTime(base, hhmmStr);
      const pre = new Date(start.getTime() - mealBufferMin * 60 * 1000);
      const post = new Date(start.getTime() + mealBufferMin * 60 * 1000);
      return { pre, post };
    };
    return [breakfast, lunch, dinner].map(makeWindow);
  }, [breakfast, lunch, dinner, mealBufferMin]);

  const schedule: Slot[] = useMemo(() => {
    const base = new Date();
    const start = withTime(base, wakeTime);
    const end = withTime(base, sleepTime);

    const trueEnd = end <= start ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : end;

    const slots: Slot[] = [];
    for (let t = new Date(start); t <= trueEnd; t = new Date(t.getTime() + intervalMin * 60 * 1000)) {
      const label = hhmm(t);
      const blocked = mealWindows.some(({ pre, post }) => t >= pre && t <= post);
      slots.push({ time: t, label, blockedByMeal: blocked });
    }
    return slots;
  }, [wakeTime, sleepTime, intervalMin, mealWindows]);

  const allowedSlots = schedule.filter((s) => !s.blockedByMeal);

  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const lastNotifiedRef = useRef<string | null>(null);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Trình duyệt không hỗ trợ Notifications.");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifyEnabled(perm === "granted");
  };

  useEffect(() => {
    if (!notifyEnabled) return;

    const tick = () => {
      const now = new Date();
      const keyNow = now.toDateString() + " " + hhmm(now);
      const candidate = allowedSlots.find((s) => hhmm(s.time) === hhmm(now));

      if (candidate) {
        const keySlot = now.toDateString() + " " + candidate.label;
        if (lastNotifiedRef.current !== keySlot) {
          new Notification("Uống nước nhé 💧", {
            body: `Đến giờ uống ~${cupSizeMl} ml. Mục tiêu hôm nay: ${goalLiters}L`,
          });
          lastNotifiedRef.current = keySlot;
        }
      } else {
        lastNotifiedRef.current = keyNow + "-none";
      }
    };

    const msToNextMinute = 60000 - (Date.now() % 60000);
    const startTimer = setTimeout(() => {
      tick();
      const iv = setInterval(tick, 60000);
      (window as any).__water_iv = iv;
    }, msToNextMinute);

    return () => {
      clearTimeout(startTimer);
      if ((window as any).__water_iv) clearInterval((window as any).__water_iv);
    };
  }, [notifyEnabled, allowedSlots, cupSizeMl, goalLiters]);

  const progress = Math.min(100, Math.round((consumedMl / goalMl) * 100));
  const addDrink = (ml: number) => setConsumedMl((v) => Math.max(0, Math.min(goalMl, v + ml)));
  const resetToday = () => setConsumedMl(0);

  const totalSlotsToday = allowedSlots.length;
  const suggestedPerSlot = totalSlotsToday > 0 ? Math.round(goalMl / totalSlotsToday) : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-5">
          <h1 className="text-2xl font-bold">Nhắc uống nước theo khoa học 💧</h1>
          <p className="text-sm text-gray-600">Thiết lập khung giờ, tránh nhắc quanh bữa chính, và theo dõi tiến độ.</p>

          <div className="bg-white rounded-2xl shadow p-4 space-y-4">
            <h2 className="font-semibold">Khung ngày</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Giờ thức dậy
                <input type="time" className="w-full mt-1 rounded-xl border p-2" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
              </label>
              <label className="text-sm">Giờ đi ngủ
                <input type="time" className="w-full mt-1 rounded-xl border p-2" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
              </label>
            </div>

            <label className="text-sm block">Khoảng nhắc (phút)
              <input type="number" min={20} step={5} className="w-full mt-1 rounded-xl border p-2" value={intervalMin} onChange={(e) => setIntervalMin(Number(e.target.value || 0))} />
            </label>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-4">
            <h2 className="font-semibold">Bữa chính & vùng tránh</h2>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm">Sáng
                <input type="time" className="w-full mt-1 rounded-xl border p-2" value={breakfast} onChange={(e) => setBreakfast(e.target.value)} />
              </label>
              <label className="text-sm">Trưa
                <input type="time" className="w-full mt-1 rounded-xl border p-2" value={lunch} onChange={(e) => setLunch(e.target.value)} />
              </label>
              <label className="text-sm">Tối
                <input type="time" className="w-full mt-1 rounded-xl border p-2" value={dinner} onChange={(e) => setDinner(e.target.value)} />
              </label>
            </div>
            <label className="text-sm block">Tránh nhắc trước/sau bữa (phút)
              <input type="number" min={10} step={5} className="w-full mt-1 rounded-xl border p-2" value={mealBufferMin} onChange={(e) => setMealBufferMin(Number(e.target.value || 0))} />
            </label>
            <label className="text-sm inline-flex items-center gap-2">
              <input type="checkbox" checked={allowTinySips} onChange={(e) => setAllowTinySips(e.target.checked)} />
              Cho phép nhắc “nhấp ngụm nhỏ” trong bữa
            </label>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-4">
            <h2 className="font-semibold">Mục tiêu</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Mục tiêu (L/ngày)
                <input type="number" step={0.1} className="w-full mt-1 rounded-xl border p-2" value={goalLiters} onChange={(e) => setGoalLiters(Number(e.target.value || 0))} />
              </label>
              <label className="text-sm">Mỗi lần (ml)
                <input type="number" step={10} className="w-full mt-1 rounded-xl border p-2" value={cupSizeMl} onChange={(e) => setCupSizeMl(Number(e.target.value || 0))} />
              </label>
            </div>
            <p className="text-xs text-gray-500">Gợi ý: {totalSlotsToday > 0 ? `${suggestedPerSlot} ml/nhắc` : "—"} để đạt {goalMl} ml.</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Thông báo</h2>
            <button
              onClick={requestPermission}
              className={`w-full rounded-2xl px-4 py-2 font-medium shadow ${notifyEnabled ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}
            >{notifyEnabled ? "Đã bật Notifications" : "Bật Notifications"}</button>
            <p className="text-xs text-gray-500">Trình duyệt có thể yêu cầu bạn cấp quyền hiển thị thông báo.</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Tiến độ hôm nay</h2>
              <button onClick={resetToday} className="text-sm underline">Đặt lại</button>
            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{consumedMl} / {goalMl} ml</span>
              <span>{progress}%</span>
            </div>

            <div className="flex gap-2 mt-3">
              {[cupSizeMl, Math.round(cupSizeMl / 2), 100].map((ml, i) => (
                <button key={i} onClick={() => addDrink(ml)} className="rounded-2xl px-3 py-2 bg-gray-100 hover:bg-gray-200">
                  +{ml} ml
                </button>
              ))}
              <button onClick={() => addDrink(-cupSizeMl)} className="rounded-2xl px-3 py-2 bg-gray-100 hover:bg-gray-200">- {cupSizeMl} ml</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold mb-3">Lịch nhắc hôm nay</h2>

            <div className="grid md:grid-cols-2 gap-3">
              {schedule.map((slot, idx) => (
                <div key={idx} className={`flex items-center justify-between rounded-xl border p-3 ${slot.blockedByMeal ? "opacity-50 bg-gray-50" : "bg-white"}`}>
                  <div>
                    <div className="font-medium">{slot.label}</div>
                    <div className="text-xs text-gray-500">{slot.blockedByMeal ? (allowTinySips ? "Trong bữa / Chỉ ngụm nhỏ" : "Tránh nhắc — gần bữa chính") : `Gợi ý: ~${suggestedPerSlot} ml`}</div>
                  </div>
                  {!slot.blockedByMeal && (
                    <button onClick={() => addDrink(suggestedPerSlot || cupSizeMl)} className="rounded-xl px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700">Đánh dấu đã uống</button>
                  )}
                </div>
              ))}
            </div>

            {schedule.length === 0 && (
              <p className="text-sm text-gray-500">Hãy thiết lập khung giờ và khoảng nhắc để tạo lịch.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold mb-2">Gợi ý khoa học (tóm tắt)</h2>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
              <li>Chia nhỏ lượng nước trong ngày (mỗi 45–90 phút), tránh uống dồn dập.</li>
              <li>Tránh uống quá nhiều ngay trước, trong, và ngay sau bữa chính (ví dụ ±{mealBufferMin} phút) để không loãng dịch vị; nhấp ngụm nhỏ nếu khát.</li>
              <li>Điều chỉnh mục tiêu theo thời tiết, vận động, bệnh lý; khi có vấn đề sức khỏe, hãy hỏi ý kiến bác sĩ.</li>
              <li>Quan sát nước tiểu vàng nhạt là một chỉ báo đơn giản của đủ nước.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
