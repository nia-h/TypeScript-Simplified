import { Key, ReactNode, createContext, useEffect, useState } from "react";
import { UnionOmit } from "../utils/types";
import { EVENT_COLORS } from "./useEvents";

export type Event = {
  id: string;
  name: string;
  color: (typeof EVENT_COLORS)[number];
  date: Date;
} & (
  | { allday: false; startTime: string; endTime: string }
  | { allday: true; startTime?: never; endTime?: never }
);

type EventContext = {
  events: Event[];
  addEvent: (event: UnionOmit<Event, "id">) => void;
  editEvent: (id: string, event: UnionOmit<Event, "id">) => void;
  deleteEvent: (id: string) => void;
};

type EventProviderProps = {
  children: ReactNode;
};

export const Context = createContext<EventContext | null>(null);

export function EventsProvider({ children }: EventProviderProps) {
  const [events, setEvents] = useLocalStorage("CalenderEvents");

  function addEvent(eventDetails: UnionOmit<Event, "id">) {
    setEvents(e => [...e, { ...eventDetails, id: crypto.randomUUID() }]);
    // setEvents(e=>[...e, { ...event, id: crypto.randomUUID() }]); //both works??
  }

  //submitFn={newEvent => editEvent(event.id, newEvent)}

  function editEvent(id: string, eventDetails: UnionOmit<Event, "id">) {
    setEvents(events => {
      return events.map(e => {
        return e.id === id ? { ...eventDetails, id } : e;
      });
    });
  }

  function deleteEvent(id: string) {
    setEvents(events => {
      return events.filter(e => e.id !== id);
    });
  }

  return (
    <Context.Provider value={{ events, addEvent, editEvent, deleteEvent }}>
      {children}
    </Context.Provider>
  );
}

export function useLocalStorage(key: string, initialValue: Event[] = []) {
  const [value, setValue] = useState<Event[]>(() => {
    const jsonValue = localStorage.getItem(key);
    if (jsonValue === null) return initialValue;

    return (JSON.parse(jsonValue) as Event[]).map(event => {
      return event.date instanceof Date
        ? event
        : { ...event, date: new Date(event.date) };
    });
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue] as const;
}
