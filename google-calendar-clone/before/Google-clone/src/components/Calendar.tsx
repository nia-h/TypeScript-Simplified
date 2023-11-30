import {
  ChangeEvent,
  FormEvent,
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
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
import { EventsProvider, type Event } from "../context/Events";
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
} & Omit<ModalProps, "children" | "isClosing" | "setIsClosing">;

function ViewMoreCalendarEventsModal({
  events,
  isOpen,
  ...props
}: ViewMoreCalendarEventsModalProps) {
  if (events.length === 0) return null;

  const [isClosing, setIsClosing] = useState(false);

  const prevIsOpen = useRef<boolean>();

  useLayoutEffect(() => {
    if (!isOpen && prevIsOpen.current) {
      setIsClosing(true);
    }

    prevIsOpen.current = isOpen;
  }, [isOpen]);

  return (
    (isOpen || isClosing) && (
      <ViewMoreCalendarEventsModalInner
        isOpen={isOpen}
        isClosing={isClosing}
        setIsClosing={setIsClosing}
        events={events}
        {...props}
      />
    )
  );
}

type ViewMoreCalendarEventsModalInnerProps = {
  isClosing: boolean;
  setIsClosing: React.Dispatch<React.SetStateAction<boolean>>;
} & ViewMoreCalendarEventsModalProps;

function ViewMoreCalendarEventsModalInner({
  events,
  ...modalProps
}: ViewMoreCalendarEventsModalInnerProps) {
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
  submitFn: (event: UnionOmit<Event, "id">) => void;
  // isClosing?: boolean;
  // setIsClosing?: React.Dispatch<React.SetStateAction<boolean>>;
} & (
  | { deleteFn: () => void; event: Event; date?: never }
  | { deleteFn?: never; event?: never; date: Date }
) &
  Omit<ModalProps, "children" | "isClosing" | "setIsClosing">;

function EventFormModal({ isOpen, ...props }: EventFormModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const prevIsOpen = useRef<boolean>();

  useLayoutEffect(() => {
    if (!isOpen && prevIsOpen.current) {
      setIsClosing(true);
    }

    prevIsOpen.current = isOpen;
  }, [isOpen]);

  return (
    (isOpen || isClosing) && (
      <EventformModalInner
        isOpen={isOpen}
        isClosing={isClosing}
        setIsClosing={setIsClosing}
        {...props}
      />
    )
  ); //

  // return isOpen && <Modal isOpen={isOpen} {...ModalProps}></Modal>;
}

type EventFormModalInnerProps = {
  isClosing: boolean;
  setIsClosing: React.Dispatch<React.SetStateAction<boolean>>;
} & EventFormModalProps;

function EventformModalInner({
  submitFn,
  event,
  deleteFn,
  date,
  ...modalProps
}: EventFormModalInnerProps) {
  const isNew = event;
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
    modalProps.closeFn();
    submitFn(newEvent);
    //I added the following three lines to clear form on close (necessary; don't know why)
    // if (isNew) setIsAllDayChecked(false);

    // console.log("eventsArray==>", sortedEvents);
    // if (endTimeRef.current) endTimeRef.current.value = "";
    // // setStartTime("");
  }

  return (
    <Modal {...modalProps}>
      <div className='modal-title'>
        <div>{isNew ? "Add" : "Edit"} Event</div>
        <small>
          {formatDate(date || event.date, {
            dateStyle: "short",
          })}
        </small>
        <button className='close-btn' onClick={modalProps.closeFn}>
          &times;
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor={`${formId}-name`}>Name</label>
          <input
            required
            defaultValue={event?.name}
            ref={nameRef}
            type='text'
            id={`${formId}-name`}
          />
        </div>
        <div className='form-group checkbox'>
          <input
            checked={isAllDayChecked}
            onChange={e => setIsAllDayChecked(e.target.checked)}
            type='checkbox'
            id={`${formId}-all-day`}
          />
          <label htmlFor={`${formId}-all-day`}>All Day?</label>
        </div>
        <div className='row'>
          <div className='form-group'>
            <label htmlFor={`${formId}-start-time`}>Start Time</label>
            <input
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required={!isAllDayChecked}
              disabled={isAllDayChecked}
              type='time'
              id={`${formId}-start-time`}
            />
          </div>
          <div className='form-group'>
            <label htmlFor={`${formId}-end-time`}>End Time</label>
            <input
              ref={endTimeRef}
              defaultValue={event?.endTime}
              min={startTime}
              required={!isAllDayChecked}
              disabled={isAllDayChecked}
              type='time'
              id={`${formId}-end-time`}
            />
          </div>
        </div>
        <div className='form-group'>
          <label>Color</label>
          <div className='row left'>
            {EVENT_COLORS.map(color => (
              <Fragment key={color}>
                <input
                  type='radio'
                  name='color'
                  value={color}
                  id={`${formId}-${color}`}
                  checked={selectedColor === color}
                  onChange={() => setSelectedColor(color)}
                  className='color-radio'
                />
                <label htmlFor={`${formId}-${color}`}>
                  <span className='sr-only'>{color}</span>
                </label>
              </Fragment>
            ))}
          </div>
        </div>
        <div className='row'>
          <button className='btn btn-success' type='submit'>
            {isNew ? "Add" : "Edit"}
          </button>
          {deleteFn != null && (
            <button onClick={deleteFn} className='btn btn-delete' type='button'>
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
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
        deleteFn={() => deleteEvent(event.id)}
        closeFn={() => setIsEditEventModalOpen(false)}
      />
    </>
  );
}
