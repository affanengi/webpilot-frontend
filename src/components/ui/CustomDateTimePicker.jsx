import { useState, useRef, useEffect } from "react";

export default function CustomDateTimePicker({ value, onChange, placeholder = "Select date and time" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Parse value or use current date for calendar view
    const initialDate = value ? new Date(value) : new Date();
    const [viewDate, setViewDate] = useState(initialDate); // For navigating months
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

    // Time state
    const [time, setTime] = useState(
        value
            ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            : "12:00"
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (date) => {
        if (!date) return "";
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }) + " " + time;
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handleDateClick = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setSelectedDate(newDate);
        // Combine with current time
        updateParent(newDate, time);
    };

    const updateParent = (date, timeStr) => {
        if (!date) return;
        const [hours, minutes] = timeStr.split(':');
        const combined = new Date(date);
        combined.setHours(parseInt(hours), parseInt(minutes));
        onChange(combined.toISOString());
    };

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const renderCalendarDays = () => {
        const days = [];
        const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const startDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === viewDate.getMonth() &&
                selectedDate.getFullYear() === viewDate.getFullYear();

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition
                    ${isSelected
                            ? "bg-primary text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const generateTimeOptions = () => {
        const times = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 30) {
                const date = new Date();
                date.setHours(i);
                date.setMinutes(j);
                times.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
            }
        }
        return times;
    };
    const timeOptions = generateTimeOptions();

    return (
        <div className="relative" ref={containerRef}>
            {/* TRIGGER */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#1e293b] bg-gray-50 dark:bg-[#020617] text-gray-900 dark:text-white flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <span className={`text-sm ${!value ? 'text-gray-400' : ''}`}>
                    {value ? formatDate(new Date(value)) : placeholder}
                </span>
                <span className="material-symbols-rounded text-gray-400 text-[20px]">
                    calendar_today
                </span>
            </button>

            {/* DROPDOWN */}
            {isOpen && (
                <div className="mt-4 w-full bg-white dark:bg-[#0b1220] border border-gray-200 dark:border-[#1e293b] rounded-xl shadow-sm p-4 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                            <span className="material-symbols-rounded text-[20px]">chevron_left</span>
                        </button>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {viewDate.toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                            <span className="material-symbols-rounded text-[20px]">chevron_right</span>
                        </button>
                    </div>

                    {/* DAYS HEADER */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <span key={i} className="text-[10px] font-bold text-gray-400 uppercase">{d}</span>
                        ))}
                    </div>

                    {/* CALENDAR GRID */}
                    <div className="grid grid-cols-7 gap-y-1 justify-items-center mb-4">
                        {renderCalendarDays()}
                    </div>

                    {/* TIME SELECTOR */}
                    <div className="pt-3 border-t border-gray-100 dark:border-[#1e293b]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Time</span>
                            <span className="text-xs text-primary font-medium">{time}</span>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 pr-1">
                            {timeOptions.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        const [timePart, modifier] = t.split(' ');
                                        let [hours, minutes] = timePart.split(':');
                                        if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
                                        if (modifier === 'AM' && hours === '12') hours = 0;

                                        const time24 = `${String(hours).padStart(2, '0')}:${minutes}`;

                                        setTime(time24);
                                        // Update parent immediately if date is defined
                                        if (selectedDate) updateParent(selectedDate, time24);
                                    }}
                                    className={`text-[10px] py-2 rounded border transition ${(new Date('2000-01-01 ' + t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) === time)
                                            ? "bg-primary border-primary text-white"
                                            : "bg-white dark:bg-[#0b1220] border-gray-200 dark:border-[#1e293b] text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:bg-primary/5"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
