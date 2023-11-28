import { ReactNode, useEffect, useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { cc } from "../utils/cc";
import { formatDate } from "../utils/formatDate";
import type { Event } from "../context/Events";

export type ModalProps = {
  event: Event;
  // children: ReactNode;
  isNew: boolean;
  isOpen: boolean;
  closeFn: () => void;
  // isNew: boolean;

  // event: Event;
};
export function Modal({ event, isNew, isOpen, closeFn }: ModalProps) {
  console.log("hit Modal");
  const [isClosing, setIsClosing] = useState<Boolean>(false);

  let prevIsOpen = useRef<Boolean>();

  useLayoutEffect(() => {
    if (!isOpen && prevIsOpen.current) setIsClosing(true);

    prevIsOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFn();

      document.addEventListener("keydown", handler);

      return () => document.removeEventListener("keydown", handler);
    };
  }, [closeFn]);

  if (!isClosing) return null;
  return createPortal(
    <div
      onAnimationEnd={() => {
        setIsClosing(false);
      }}
      className={cc("modal", isClosing && "closing")}>
      <div className='overlay' onClick={closeFn} />
      <div className='modal-body'>
        <div className='modal-title'>
          <div>{isNew ? "Add " : "Edit "}event</div>
          <small>{formatDate(date || event.date, { dateStyle: "short" })}</small>
          <button className='close-btn' onClick={ModalProps.closeFn}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor={formId + "-name"}>Name</label>
            <input
              defaultValue={event?.name || ""}
              ref={nameRef}
              required
              type='text'
              id={formId + "-name"}
            />
          </div>
          <div className='form-group checkbox'>
            <input
              type='checkbox'
              id={`${formId}-all-day`}
              checked={isAllDayChecked}
              // onChange={() => setIsAllDayChecked(ad => !ad)} // different approach?
              onChange={e => setIsAllDayChecked(e.target.checked)}
            />
            <label htmlFor={`${formId}-all-day`}>All Day?</label>
          </div>
          <div className='row'>
            <div className='form-group'>
              <label htmlFor={formId + "-start-time"}>Start Time</label>
              <input
                type='time'
                id={formId + "-start-time"}
                // defaultValue={event?.startTime || ""}
                disabled={isAllDayChecked}
                required={!isAllDayChecked}
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                }}
              />
            </div>
            <div className='form-group'>
              <label htmlFor={formId + "-end-time"}>End Time</label>
              <input
                type='time'
                id={formId + "-end-time"}
                disabled={isAllDayChecked}
                required={!isAllDayChecked}
                min={startTime}
                // value={endTime}
                // onChange={e => {
                //   setEndTime(e.target.value);
                ref={endTimeRef}
                defaultValue={event?.endTime || ""}
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
                    checked={color === selectedColor}
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

            {deleteFn && (
              <button className='btn btn-delete' type='button' onClick={deleteFn}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.querySelector("#modal-container") as HTMLElement
  );
}
