import { useState } from "react";
import type { AvailableSlot } from "../../types";

type Props = {
  selectedDate: string;
  availableDaysOfWeek: number[];
  availableDates: string[];
  slots: AvailableSlot[];
  selectedSlot: string;
  loadingSlots: boolean;
  onDateSelect: (date: string) => void;
  onSlotSelect: (scheduledAt: string) => void;
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toLocalDateStr(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function BookingCalendar({
  selectedDate,
  availableDaysOfWeek,
  availableDates,
  slots,
  selectedSlot,
  loadingSlots,
  onDateSelect,
  onSlotSelect,
}: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPadding = new Date(year, month, 1).getDay();

  const cells: (Date | null)[] = [
    ...Array<null>(startPadding).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const canGoPrev =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth());

  function isAvailable(date: Date): boolean {
    if (date < today) return false;
    if (availableDates.length > 0) {
      return availableDates.includes(toLocalDateStr(date));
    }
    return availableDaysOfWeek.includes(date.getDay());
  }

  function handleDayClick(date: Date) {
    if (!isAvailable(date)) return;
    onDateSelect(toLocalDateStr(date));
  }

  return (
    <div className="booking-cal">
      <div className="booking-cal-header">
        <button
          aria-label="Mes anterior"
          className="booking-cal-nav"
          disabled={!canGoPrev}
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          type="button"
        >
          ‹
        </button>
        <span className="booking-cal-month-label">
          {MONTHS[month]} {year}
        </span>
        <button
          aria-label="Mes siguiente"
          className="booking-cal-nav"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          type="button"
        >
          ›
        </button>
      </div>

      <div className="booking-cal-grid">
        {WEEKDAYS.map((d) => (
          <div className="booking-cal-weekday" key={d}>{d}</div>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div key={`p-${i}`} />;

          const dateStr = toLocalDateStr(date);
          const available = isAvailable(date);
          const isToday = date.getTime() === today.getTime();
          const isSelected = dateStr === selectedDate;

          const cls = [
            "booking-cal-day",
            !available && "booking-cal-day--off",
            isToday && "booking-cal-day--today",
            isSelected && "booking-cal-day--selected",
            available && !isSelected && "booking-cal-day--available",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              className={cls}
              disabled={!available}
              key={dateStr}
              onClick={() => handleDayClick(date)}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="booking-cal-slots-wrap">
          <p className="booking-cal-slots-label">
            Horarios disponibles
          </p>
          {loadingSlots ? (
            <p className="booking-cal-loading">Cargando horarios…</p>
          ) : slots.length === 0 ? (
            <div className="empty-state">No hay horarios disponibles para este día.</div>
          ) : (
            <div className="slot-grid">
              {slots.map((slot) => (
                <button
                  className={
                    selectedSlot === slot.scheduledAt
                      ? "button button-primary"
                      : "button button-secondary"
                  }
                  key={slot.scheduledAt}
                  onClick={() => onSlotSelect(slot.scheduledAt)}
                  type="button"
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
