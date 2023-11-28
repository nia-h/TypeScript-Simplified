import {
  ChangeEvent,
  FormEvent,
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isBefore,
  endOfDay,
  isToday,
  subMonths,
  addMonths,
  isSameDay,
  parse,
} from "date-fns";
import { formatDate } from "../utils/formatDate";
import { cc } from "../utils/cc";
import { useEvents } from "../context/useEvents";
import { Modal, ModalProps } from "./Modal";
import { UnionOmit } from "../utils/types";
import type { Event } from "../context/Events";
import { EVENT_COLORS } from "../context/useEvents";
import { OverflowContainer } from "./OverflowCotainer";

export default function Calendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfWeek(startOfMonth(selectedMonth));
    const monthEnd = endOfWeek(endOfMonth(selectedMonth));
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [selectedMonth]);

  const { events } = useEvents();

  return (
    <>
      <div className='calendar'>
        <div className='header'>
          <button
            className='btn'
            onClick={() => {
              setSelectedMonth(new Date());
            }}>
            Today
          </button>
          <div>
            <button
              className='month-change-btn'
              onClick={() => {
                setSelectedMonth(m => subMonths(m, 1));
              }}>
              &lt;
            </button>
            <button
              className='month-change-btn'
              onClick={() => {
                setSelectedMonth(m => addMonths(m, 1));
              }}>
              &gt;
            </button>
          </div>
          <span className='month-title'>
            {formatDate(selectedMonth, { month: "long", year: "numeric" })}
          </span>
        </div>
        <div className='days'>
          {calendarDays.map((day, index) => (
            <CalendarDay
              key={day.getTime()}
              day={day}
              showWeekName={index < 7}
              selectedMonth={selectedMonth}
              eventsOfDay={events.filter(e => isSameDay(day, e.date))}
            />
          ))}
        </div>
      </div>
    </>
  );
}

type CalendarDayProps = {
  day: Date;
  showWeekName: boolean;
  selectedMonth: Date;
  eventsOfDay: Event[];
};

function CalendarDay({
  day,
  showWeekName,
  selectedMonth,
  eventsOfDay,
}: CalendarDayProps) {
  const { addEvent } = useEvents();
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isViewMoreEventModalOpen, setIsViewMoreEventModalOpen] = useState(false);

  const sortedEvents = useMemo(() => {
    const timeToNumber = (time: string) => {
      return parseFloat(time.replace(":", "."));
    };

    return [...eventsOfDay].sort((a, b) => {
      if (a.allday && b.allday) {
        return 0;
      } else if (a.allday) {
        return -1; // (< 0) sort a before b (a's index is alwasy b's index + 1)
      } else if (b.allday) {
        return 1; //  (> 0) sort a after b (a's index is alwasy b's index + 1)
      } else {
        return timeToNumber(a.startTime) - timeToNumber(b.startTime);
      }
    });
  }, [eventsOfDay]);

  return (
    <>
      {/* <div className='day non-month-day old-month-day'> */}
      <div
        className={cc(
          "day",
          !isSameMonth(day, selectedMonth) && "non-month-day",
          isBefore(endOfDay(day), new Date()) && "old-month-day"
        )}>
        <div className='day-header'>
          {showWeekName && (
            <div className='week-name'>{formatDate(day, { weekday: "short" })}</div>
          )}
          <div className={cc("day-number", isToday(day) && "today")}>
            {formatDate(day, { day: "numeric" })}
          </div>
          <button
            className='add-event-btn'
            onClick={() => setIsNewEventModalOpen(true)}>
            +
          </button>
        </div>

        {sortedEvents.length > 0 && (
          <OverflowContainer
            className='events'
            items={sortedEvents}
            renderItem={i => <CalendarEvent event={i} />}
            //My experiment below to reduce unnecessary prop drilling (is there a performance downside?   )
            // getKey={a => a.id}
            renderOverflow={n => (
              <>
                <button
                  onClick={() => setIsViewMoreEventModalOpen(true)}
                  className='events-view-more-btn'>
                  +{n} more
                </button>
                <ViewMoreCalendarEventsModal
                  events={sortedEvents}
                  isOpen={isViewMoreEventModalOpen}
                  closeFn={() => setIsViewMoreEventModalOpen(false)}
                />
              </>
            )}
          />
        )}
      </div>
      <EventFormModal
        isOpen={isNewEventModalOpen}
        submitFn={addEvent} //shorthand for onSubmit={newEvent => addEvent(newEvent)}
        date={day}
        closeFn={() => setIsNewEventModalOpen(false)}
      />
    </>
  );
}

type ViewMoreCalendarEventsModalProps = {
  events: Event[];
} & Omit<ModalProps, "children">;

function ViewMoreCalendarEventsModal({
  events,
  ...modalProps
}: ViewMoreCalendarEventsModalProps) {
  if (events.length === 0) return null;

  return (
    <Modal {...modalProps}>
      <div className='modal-title'>
        <small>{formatDate(events[0].date, { dateStyle: "short" })}</small>
        <button className='close-btn' onClick={modalProps.closeFn}>
          &times;
        </button>
      </div>
      <div className='events'>
        {events.map(event => (
          <CalendarEvent event={event} key={event.id} />
        ))}
      </div>
    </Modal>
  );
}

type EventFormModalProps = {
  isOpen: boolean;
  submitFn: (event: UnionOmit<Event, "id">) => void;
} & (
  | { deleteFn: () => void; event: Event; date?: never }
  | { deleteFn?: never; event?: never; date: Date }
) &
  Omit<ModalProps, "children">;

function EventFormModal({
  isOpen,
  submitFn,
  deleteFn,
  event,
  date,
  ...ModalProps
}: EventFormModalProps) {
  const isNew = !event;
  const formId = useId();

  const [selectedColor, setSelectedColor] = useState(
    event?.color || EVENT_COLORS[0]
  );

  const [isAllDayChecked, setIsAllDayChecked] = useState(event?.allday || false);
  const [startTime, setStartTime] = useState(event?.startTime || "");
  // const [endTime, setEndTime] = useState(event?.endTime || "");
  const endTimeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value;
    const endTime = endTimeRef.current?.value;

    if (!name) return;
    //if (name == null ||name =="")return //same thing?

    const commonProps = {
      name,
      date: date || event?.date,
      color: selectedColor,
    };

    let newEvent: UnionOmit<Event, "id">;
    if (isAllDayChecked) {
      newEvent = {
        ...commonProps,
        allday: true,
      };
    } else {
      // if (!startTime || !endTime) return; //not safe
      if (startTime == null || startTime == "" || endTime == null || endTime == "")
        return;
      newEvent = {
        ...commonProps,
        startTime,
        endTime,
        allday: false,
      };
    }
    ModalProps.closeFn();
    submitFn(newEvent);
    //I added the following three lines to clear form on close (necessary; don't know why)
    // if (isNew) setIsAllDayChecked(false);

    // console.log("eventsArray==>", sortedEvents);
    // if (endTimeRef.current) endTimeRef.current.value = "";
    // // setStartTime("");
  }

  // useEffect(() => {
  //   console.log("useEffect--->isAllDayChecked==>", isAllDayChecked); //
  //   if (isAllDayChecked) {
  //     setStartTime("");
  //   }
  // }, [isAllDayChecked]);  //no need to clear out startTime and endTime if Allday
  return (
    isOpen && <Modal event={event} isNew={isNew} isOpen={isOpen} {...ModalProps} />
  );

  // return isOpen && <Modal isOpen={isOpen} {...ModalProps}></Modal>;
}

function CalendarEvent({ event }: { event: Event }) {
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  const { editEvent, deleteEvent } = useEvents();

  return (
    <>
      <button
        onClick={() => setIsEditEventModalOpen(true)}
        className={cc("event", event.color, event.allday && "all-day-event")}>
        {event.allday ? (
          <div className='event-name'>{event.name}</div>
        ) : (
          <>
            <div className={cc("color-dot", event.color)}></div>
            <div className='event-time'>
              {formatDate(parse(event.startTime, "HH:mm", event.date), {
                timeStyle: "short",
              })}
            </div>
            <div className='event-name'>{event.name}</div>
          </>
        )}
      </button>

      <EventFormModal
        isOpen={isEditEventModalOpen}
        submitFn={newEvent => editEvent(event.id, newEvent)}
        event={event}
        closeFn={() => setIsEditEventModalOpen(false)}
        deleteFn={() => deleteEvent(event.id)}
      />
    </>
  );
}
